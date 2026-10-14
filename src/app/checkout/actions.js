'use server'
const { createAdminClient: _injectedAdminClient } = require('@/utils/supabase/admin');;

import { headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { verifyAndActivate } from '@/lib/payments';
import { checkPaymentSecurity, recordImmediateFailedAttempt } from '@/lib/fraudGuard';

export async function processDirectCharge(planId, phoneNumber, network, promoResult = null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('user_profiles').select('email, username').eq('email', user.email)
    .single();

  // ── Fraud & Rate-Limiting Security Check ─────────────────────────────────
  const sec = await checkPaymentSecurity({
    userId: user.id,
    userEmail: user.email,
    username: profile?.username,
    phoneNumber,
    network,
  });

  if (!sec.allowed) {
    return {
      error: sec.message,
      blocked: true,
      ip: sec.ip,
      reason: sec.reason
    };
  }

  // Get Flutterwave Secret Key
  const { data: settings } = await _injectedAdminClient().from('admin_settings')
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

  let amount = plan.price;
  const codeToVerify = typeof promoResult === 'string' ? promoResult.trim() : promoResult?.code?.trim();
  if (codeToVerify) {
    const { data: promo } = await _injectedAdminClient()
      .from('promo_codes')
      .select('*')
      .eq('code', codeToVerify.toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    if (promo) {
      const isExpired = promo.expires_at && new Date(promo.expires_at) < new Date();
      const isLimitReached = promo.max_uses && promo.use_count >= promo.max_uses;

      const { data: alreadyUsed } = await _injectedAdminClient()
        .from('promo_code_uses')
        .select('id')
        .eq('code_id', promo.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!isExpired && !isLimitReached && !alreadyUsed) {
        let discount = 0;
        if (promo.discount_type === 'percentage') {
          discount = Math.floor((plan.price * promo.discount_value) / 100);
        } else {
          discount = Math.min(plan.price, promo.discount_value);
        }
        amount = Math.max(100, plan.price - discount);
      } else {
        return { error: 'The applied promo code is expired, fully claimed, or already used.' };
      }
    } else {
      return { error: 'Invalid promo code.' };
    }
  }
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

  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const siteUrl = `${protocol}://${host}`;

  // Request direct charge from Flutterwave v3 API
  const payload = {
    tx_ref,
    amount,
    currency: 'UGX',
    email: profile?.email || user.email,
    fullname: profile?.username || (profile?.email || user.email).split('@')[0],
    phone_number: phoneNumber,
    network: network || 'MTN',
    redirect_url: `${siteUrl}/checkout/verify`
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
      recordImmediateFailedAttempt(sec.ip, phoneNumber);
      return { error: data.message || 'Failed to initiate mobile money charge', ip: sec.ip };
    }
  } catch (error) {
    console.error("Checkout Fetch Error:", error);
    return { error: 'Internal server error during mobile money charge' };
  }
}

export async function checkTransactionStatus(tx_ref) {
  const supabaseAuth = await createClient(); // standard client verifies who is asking
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) return { status: 'unauthorized' };

  // Always real-time: verifies directly with Flutterwave (cache: 'no-store') and
  // activates atomically, shared with the webhook so access is granted exactly once.
  const result = await verifyAndActivate(tx_ref, { userId: user.id });

  if (result.status === 'successful') {
    // Drop any cached render of pages that depend on subscription state.
    revalidatePath('/', 'layout');
  }

  return result;
}
