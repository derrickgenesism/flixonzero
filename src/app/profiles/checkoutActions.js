'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function processExtraProfileCharge(phoneNumber, network, amount) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  // Get Flutterwave Secret Key
  const { data: settings } = await supabase
    .from('admin_settings')
    .select('*')
    .in('setting_key', ['flutterwave_secret_key']);

  const secretKey = settings?.find(s => s.setting_key === 'flutterwave_secret_key')?.setting_value;

  if (!secretKey) {
    return { error: 'Payments are currently disabled.' };
  }

  const tx_ref = `flixon_extra_profile_${user.id}_${Date.now()}`;

  // Log pending transaction in DB
  const { error: txError } = await supabase.from('transactions').insert({
    tx_ref,
    user_id: user.id,
    amount,
    currency: 'UGX',
    status: 'pending',
    plan_type: 'extra_profile'
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
    email: user.email,
    phone_number: phoneNumber,
    network: network || 'MTN',
    redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/profiles/verify`
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

    if (data.status === 'success' || data.message === 'Charge initiated') {
      if (data.meta && data.meta.authorization && data.meta.authorization.mode === 'redirect') {
        return { success: true, redirect_url: data.meta.authorization.redirect, tx_ref };
      }
      return { success: true, message: data.message || 'Charge initiated successfully', tx_ref };
    } else {
      return { error: data.message || 'Failed to initiate mobile money charge' };
    }
  } catch (error) {
    return { error: 'Internal server error during mobile money charge' };
  }
}

export async function checkExtraProfileTransactionStatus(txRef) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { status: 'error' };

  const { data, error } = await supabase
    .from('transactions')
    .select('status')
    .eq('tx_ref', txRef)
    .single();

  if (error || !data) return { status: 'pending' };

  return { status: data.status };
}
