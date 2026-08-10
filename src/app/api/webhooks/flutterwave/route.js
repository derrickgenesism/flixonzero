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
          flw_transaction_id: payload.data.id.toString(),
          updated_at: new Date().toISOString()
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

      // 6. Referral Processing
      try {
        const { data: allSettings } = await supabase.from('admin_settings').select('*');
        const refEnabled = allSettings?.find(s => s.setting_key === 'referrals_enabled')?.setting_value === 'true';
        
        if (refEnabled) {
          const { data: referral } = await supabase
            .from('referrals')
            .select('*')
            .eq('referred_id', transaction.user_id)
            .eq('status', 'pending')
            .single();

          if (referral) {
            // Calculate reward
            const refType = allSettings?.find(s => s.setting_key === 'referral_reward_type')?.setting_value || 'flat';
            const refAmount = Number(allSettings?.find(s => s.setting_key === 'referral_reward_amount')?.setting_value || 0);
            
            let reward = 0;
            if (refType === 'percentage') {
              reward = (transaction.amount * refAmount) / 100;
            } else {
              reward = refAmount;
            }

            if (reward > 0) {
              // Get current earnings of referrer
              const { data: referrerEarnings } = await supabase
                .from('referral_earnings')
                .select('*')
                .eq('user_id', referral.referrer_id)
                .maybeSingle();

              if (referrerEarnings) {
                await supabase
                  .from('referral_earnings')
                  .update({ amount_earned: Number(referrerEarnings.amount_earned) + reward })
                  .eq('user_id', referral.referrer_id);
              } else {
                await supabase
                  .from('referral_earnings')
                  .insert({ user_id: referral.referrer_id, amount_earned: reward });
              }

              // Mark referral as converted
              await supabase
                .from('referrals')
                .update({ status: 'converted' })
                .eq('id', referral.id);
                
              console.log(`Credited referrer ${referral.referrer_id} with ${reward} UGX for user ${transaction.user_id}`);
            }
          }
        }
      } catch (refErr) {
        console.error('Error processing referral:', refErr);
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
