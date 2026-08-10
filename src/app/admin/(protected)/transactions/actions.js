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
