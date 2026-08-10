'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

export async function processDirectCharge(planId, phoneNumber, network) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('email')
    .eq('id', user.id)
    .single();

  // Get Flutterwave Secret Key
  const { data: settings } = await supabase
    .from('admin_settings')
    .select('*')
    .in('setting_key', ['flutterwave_secret_key']);

  const secretKey = settings?.find(s => s.setting_key === 'flutterwave_secret_key')?.setting_value;

  if (!secretKey) {
    return { error: 'Payments are currently disabled. (Missing Secret Key)' };
  }

  // Fetch the selected plan from DB to get the secure price and duration
  const { data: plan, error: planError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (planError || !plan || !plan.is_active) {
    return { error: 'Invalid or inactive plan selected.' };
  }

  const amount = plan.price;
  const tx_ref = `flixon_${user.id}_${Date.now()}`;

  // Log pending transaction in DB
  const { error: txError } = await supabase.from('transactions').insert({
    tx_ref,
    user_id: user.id,
    amount,
    currency: 'UGX',
    status: 'pending',
    plan_type: plan.id.toString(), 
    duration_days: plan.duration_days 
  });

  if (txError) {
    console.error("TX Log Error:", txError);
    return { error: 'Failed to initiate transaction' };
  }

  // Request direct charge from Flutterwave v3 API
  const payload = {
    tx_ref,
    amount,
    currency: 'UGX',
    email: profile?.email || user.email,
    phone_number: phoneNumber,
    network: network || 'MTN',
    redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/verify`
  };

  try {
    const response = await fetch('https://api.flutterwave.com/v3/charges?type=mobile_money_uganda', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("FLUTTERWAVE DIRECT CHARGE RESPONSE:", data);

    if (data.status === 'success' || data.message === 'Charge initiated') {
      if (data.meta && data.meta.authorization && data.meta.authorization.mode === 'redirect') {
        return { success: true, redirect_url: data.meta.authorization.redirect, tx_ref };
      }
      return { success: true, message: data.message || 'Charge initiated successfully', tx_ref };
    } else {
      console.error("Flutterwave API Error:", data);
      return { error: data.message || 'Failed to initiate mobile money charge' };
    }
  } catch (error) {
    console.error("Checkout Fetch Error:", error);
    return { error: 'Internal server error during mobile money charge' };
  }
}

export async function checkTransactionStatus(tx_ref) {
  // Use Service Role Key to bypass RLS for updating transaction and profile
  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const supabaseAuth = await createClient(); // Still use standard client to verify the user
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) return { status: 'unauthorized' };

  // 1. Check local DB first
  const { data: transaction, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('tx_ref', tx_ref)
    .single();

  if (error || !transaction) {
    return { status: 'not_found' };
  }

  // If already processed via webhook or previous check
  if (transaction.status === 'successful') {
    return { status: 'successful' };
  }

  // 2. Fetch Flutterwave Secret Key to query API directly
  const { data: settings } = await supabase
    .from('admin_settings')
    .select('setting_value')
    .eq('setting_key', 'flutterwave_secret_key')
    .single();

  const secretKey = settings?.setting_value;
  if (!secretKey) return { status: 'pending' };

  // 3. Ping Flutterwave to check true status
  try {
    const fwRes = await fetch(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${tx_ref}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    const fwData = await fwRes.json();
    console.log("FLUTTERWAVE VERIFY STATUS:", fwData);

    // 4. If successful, process the subscription manually (fallback for localhost without webhooks)
    if (fwData.status === 'success' && fwData.data?.status === 'successful') {
      
      // Update Transaction Status
      await supabase
        .from('transactions')
        .update({ 
          status: 'successful', 
          flw_transaction_id: fwData.data.id.toString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id);

      // Grant Subscription Access
      let daysToAdd = transaction.duration_days || 0;
      
      // We must lookup by email because user_profiles.id is an integer, but transaction.user_id is a UUID
      const { data: authData } = await supabase.auth.admin.getUserById(transaction.user_id);
      const userEmail = authData?.user?.email;

      if (userEmail) {
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
          // Update existing profile
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

      return { status: 'successful' };
    }

    // If it failed or is still pending
    if (fwData.data?.status === 'failed') {
      await supabase.from('transactions').update({ status: 'failed' }).eq('id', transaction.id);
      return { status: 'failed', message: 'Transaction failed or was cancelled.' };
    }

  } catch (err) {
    console.error("Error verifying with Flutterwave:", err);
  }

  return { status: 'pending' };
}
