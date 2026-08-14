import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Fetch webhook secret from DB settings
    const { data: settings } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'flutterwave_webhook_secret')
      .single();

    const webhookSecret = settings?.setting_value;

    // 2. Verify Webhook Signature
    const signature = req.headers.get('verif-hash');
    if (!signature || (webhookSecret && signature !== webhookSecret)) {
      console.error('Webhook Error: Invalid Signature');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    console.log('Flutterwave Webhook received:', payload);

    // 3. Process Successful Payment
    if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
      const tx_ref = payload.data.tx_ref;
      
      // --- PPV BRANCH ---
      if (tx_ref.startsWith('PPV-')) {
        const ppvRes = await supabase
          .from('ppv_purchases')
          .update({
            status: 'success',
            expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
          })
          .eq('tx_ref', tx_ref)
          .select('user_id, movie_id')
          .single();

        if (ppvRes.data) {
          // Notify user
          await supabase.from('notifications').insert({
            user_id: ppvRes.data.user_id,
            type: 'ppv_activated',
            title: '48-Hour Access Activated!',
            body: 'Your rental is now active. Enjoy watching!',
            link: `/movie/${ppvRes.data.movie_id}`
          });
        }

        console.log('PPV activated for tx_ref:', tx_ref);
        return NextResponse.json({ status: 'ppv_success' }, { status: 200 });
      }

      // --- SUBSCRIPTION BRANCH ---
      // Look up the transaction in our DB
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('tx_ref', tx_ref)
        .single();

      if (txError || !transaction) {
        console.error('Webhook Error: Transaction not found in DB', tx_ref);
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }

      // If already processed, ignore
      if (transaction.status === 'successful') {
        return NextResponse.json({ status: 'already_processed' }, { status: 200 });
      }

      // 4. Update Transaction Status
      await supabase
        .from('transactions')
        .update({ 
          status: 'successful', 
          flw_transaction_id: payload.data.id.toString()
        })
        .eq('id', transaction.id);

      // 5. Grant Access
      if (transaction.plan_type === 'extra_profile') {
        // Increment extra_profile_slots
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('extra_profile_slots')
          .eq('id', transaction.user_id)
          .single();
        
        await supabase
          .from('user_profiles')
          .update({
            extra_profile_slots: (profile?.extra_profile_slots || 0) + 1
          })
          .eq('id', transaction.user_id);
          
        console.log(`Successfully added extra profile slot for user ${transaction.user_id}`);
        return NextResponse.json({ status: 'extra_profile_success' }, { status: 200 });
      }

      // --- SUBSCRIPTION LOGIC ---
      let daysToAdd = transaction.duration_days || 0;

      // We must lookup by email because user_profiles.id is an integer, but transaction.user_id is a UUID
      const { data: authData } = await supabase.auth.admin.getUserById(transaction.user_id);
      const userEmail = authData?.user?.email;

      if (userEmail) {
        // Calculate new expiry (if they already have an active subscription, add to it)
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('subscription_end_date')
          .eq('email', userEmail)
          .single();

        let currentExpiry = new Date();
        if (profile?.subscription_end_date) {
          const profileExpiry = new Date(profile.subscription_end_date);
          if (profileExpiry > currentExpiry) {
            currentExpiry = profileExpiry;
          }
        }

        currentExpiry.setDate(currentExpiry.getDate() + daysToAdd);

        if (profile) {
          // Update the user's profile
          await supabase
            .from('user_profiles')
            .update({ 
              subscription_end_date: currentExpiry.toISOString(),
              subscription_plan: transaction.plan_type
            })
            .eq('email', userEmail);
        } else {
          // Profile didn't exist, insert a new one
          await supabase
            .from('user_profiles')
            .insert({
              email: userEmail,
              username: userEmail.split('@')[0],
              subscription_end_date: currentExpiry.toISOString(),
              subscription_plan: transaction.plan_type
            });
        }
      }

      console.log(`Successfully processed subscription for user ${transaction.user_id} (${transaction.plan_type})`);

      // 6. Referral Processing (CPA)
      try {
        const { data: allSettings } = await supabase.from('admin_settings').select('*');
        const cpaEnabled = allSettings?.find(s => s.setting_key === 'affiliate_cpa_enabled')?.setting_value === 'true';
        
        if (cpaEnabled && userEmail) {
          // Check if this user was referred by an affiliate
          const { data: profileWithRef } = await supabase
            .from('user_profiles')
            .select('id, referred_by')
            .eq('email', userEmail)
            .single();

          if (profileWithRef && profileWithRef.referred_by) {
            // Check if we have a reward configured for this plan
            // E.g., setting_key could be 'affiliate_plan_1_reward' (using plan.id, but transaction has plan_name or duration?
            // transaction.plan_type is usually 'Monthly Pass' or 'Daily Pass' or 'extra_profile'
            // We should just use a generic 'affiliate_cpa_reward' or map it if we know the plan IDs.
            // Wait, we need to map the plan name or ID. Let's look up the plan by name.
            const { data: planData } = await supabase
              .from('subscription_plans')
              .select('id')
              .eq('name', transaction.plan_type)
              .maybeSingle();

            if (planData) {
              const rewardSettingKey = `affiliate_plan_${planData.id}_reward`;
              const rewardAmountStr = allSettings?.find(s => s.setting_key === rewardSettingKey)?.setting_value;
              const reward = Number(rewardAmountStr || 0);

              if (reward > 0) {
                // Get affiliate
                const { data: affiliate } = await supabase
                  .from('affiliates')
                  .select('id, balance, total_earned')
                  .eq('id', profileWithRef.referred_by)
                  .single();

                if (affiliate) {
                  // Add balance
                  await supabase
                    .from('affiliates')
                    .update({ 
                      balance: Number(affiliate.balance) + reward,
                      total_earned: Number(affiliate.total_earned) + reward
                    })
                    .eq('id', affiliate.id);

                  // Record commission
                  await supabase.from('affiliate_commissions').insert({
                    affiliate_id: affiliate.id,
                    amount: reward,
                    type: 'subscription',
                    description: `Commission for ${transaction.plan_type}`,
                    referred_user_id: profileWithRef.id
                  });

                  console.log(`Credited affiliate ${affiliate.id} with ${reward} UGX for subscription of ${profileWithRef.id}`);
                }
              }
            }
          }
        }
      } catch (refErr) {
        console.error('Error processing affiliate commission:', refErr);
      }

      return NextResponse.json({ status: 'success' }, { status: 200 });
    }

    // Ignore other events (e.g. transfer.completed)
    return NextResponse.json({ status: 'ignored' }, { status: 200 });

  } catch (err) {
    console.error('Webhook Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
