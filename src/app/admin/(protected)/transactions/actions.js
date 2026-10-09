'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function manualApproveTransaction(transactionId) {
  // Use Service Role Key to bypass RLS
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const supabaseAuth = await createClient(); // Verify caller is admin
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabaseAuth
    .from('user_profiles')
    .select('role')
    .eq('email', user.email)
    .single();

  if (profile?.role !== 'administrator') {
    return { error: 'Access Denied: Admin only.' };
  }

  // 1. Fetch the transaction
  const { data: transaction, error: txError } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  if (txError || !transaction) {
    return { error: 'Transaction not found.' };
  }

  if (transaction.status === 'successful') {
    return { error: 'Transaction is already successful.' };
  }

  // 2. Update transaction status
  const { error: updateError } = await supabaseAdmin
    .from('transactions')
    .update({ 
      status: 'successful'
    })
    .eq('id', transaction.id);

  if (updateError) {
    console.error("Update Transaction Error:", updateError);
    return { error: 'Failed to update transaction status: ' + updateError.message };
  }

  // 3. Update user profile subscription end date
  // 3. Get user email securely via Admin API
  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(transaction.user_id);
  const userEmail = authUser?.user?.email;

  if (!userEmail) {
    return { error: 'Transaction updated, but user email could not be found to grant subscription.' };
  }

  let daysToAdd = transaction.duration_days || 0;
  const { data: userProfile } = await supabaseAdmin
    .from('user_profiles')
    .select('subscription_end_date')
    .eq('email', userEmail)
    .single();

  let currentExpiry = new Date();
  if (userProfile?.subscription_end_date) {
    const profileExpiry = new Date(userProfile.subscription_end_date);
    if (profileExpiry > currentExpiry) {
      currentExpiry = profileExpiry;
    }
  }

  currentExpiry.setDate(currentExpiry.getDate() + daysToAdd);

  const { error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .update({ 
      subscription_end_date: currentExpiry.toISOString(),
      subscription_plan: transaction.plan_type
    })
    .eq('email', userEmail);

  if (profileError) {
    console.error("Profile update error:", profileError);
    return { error: 'Transaction updated, but failed to grant subscription: ' + profileError.message };
  }

  return { success: true, daysAdded: daysToAdd };
}

export async function diagnoseTransaction(transactionId) {
  try {
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: profile } = await supabaseAuth.from('user_profiles').select('role').eq('email', user.email).single();
    if (profile?.role !== 'administrator') return { error: 'Access Denied: Admin only.' };

    // 1. Get the transaction details
    const { data: tx } = await supabaseAdmin.from('transactions').select('*').eq('id', transactionId).single();
    if (!tx) return { error: 'Transaction not found in database.' };

    // 2. Get Flutterwave Secret
    const { data: settings } = await supabaseAdmin.from('admin_settings').select('setting_value').eq('setting_key', 'flutterwave_secret_key').single();
    const flwSecret = settings?.setting_value;
    if (!flwSecret) return { error: 'Flutterwave Secret Key not configured in Settings.' };

    // 3. Query Flutterwave API by tx_ref
    let apiUrl = `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${tx.tx_ref}`;
    let res = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${flwSecret}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    let data = await res.json();
    
    // Sometimes verify_by_reference fails if the tx never reached completion on FLW side, we can also try the general endpoint
    if (data.status === 'error' && data.message && data.message.includes("No transaction was found")) {
      const allTxRes = await fetch(`https://api.flutterwave.com/v3/transactions?tx_ref=${tx.tx_ref}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${flwSecret}`, 'Content-Type': 'application/json' },
        cache: 'no-store'
      });
      const allTxData = await allTxRes.json();
      if (allTxData.status === 'success' && allTxData.data && allTxData.data.length > 0) {
        data = { status: 'success', data: allTxData.data[0] };
      }
    }

    if (data.status === 'error') {
      return { 
        diagnostics: {
          title: "Transaction Not Found on Flutterwave",
          summary: "This payment was initiated in the app but never registered with the Flutterwave server. This usually means the user dropped off immediately before the mobile money prompt could even be generated, or their network connection failed instantly.",
          rawError: data.message,
          flwData: null
        }
      };
    }

    // 4. Parse the Flutterwave response and build a detailed diagnostic report
    const flw = data.data;
    let title = "";
    let summary = "";

    const processorMsg = (flw.processor_response || "").toLowerCase();
    const flwMsg = (flw.flw_ref || "").toLowerCase();

    if (flw.status === 'successful') {
      title = "Transaction Successful";
      summary = "Flutterwave confirms this payment was fully successful. If it says failed in the database, it's likely a webhook sync issue.";
    } else if (processorMsg.includes('insufficient funds') || processorMsg.includes('not enough money')) {
      title = "Insufficient Funds";
      summary = "The user did not have enough money in their mobile money wallet to cover the transaction amount.";
    } else if (processorMsg.includes('user cancelled') || processorMsg.includes('cancelled by user')) {
      title = "Cancelled by User";
      summary = "The prompt successfully reached the user's phone, but they manually cancelled it instead of entering their PIN.";
    } else if (processorMsg.includes('timeout') || processorMsg.includes('timed out')) {
      title = "Mobile Money Prompt Timeout";
      summary = "The prompt was sent to the user's phone, but they ignored it or took too long to enter their PIN. The telecom provider timed out the request.";
    } else if (processorMsg.includes('invalid pin') || processorMsg.includes('wrong pin')) {
      title = "Invalid PIN Entered";
      summary = "The user entered an incorrect Mobile Money PIN.";
    } else if (processorMsg.includes('amount') || processorMsg.includes('limit')) {
      title = "Account Limit Reached";
      summary = "The user's mobile money account has hit a daily/monthly limit, or the transaction amount is not allowed.";
    } else if (flw.status === 'failed') {
      title = "Payment Failed";
      summary = `The telecom provider rejected the transaction. Reason provided: ${flw.processor_response || 'Unknown'}.`;
    } else {
      title = `Status: ${flw.status}`;
      summary = `The transaction is currently marked as ${flw.status}. Processor response: ${flw.processor_response || 'N/A'}.`;
    }

    return {
      diagnostics: {
        title,
        summary,
        flwData: flw
      }
    };

  } catch (err) {
    return { error: err.message };
  }
}
