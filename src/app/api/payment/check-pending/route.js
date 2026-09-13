import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // 1. Verify the user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // 2. Find the most recent PENDING transaction for this user
    // We do NOT re-check transactions that are already 'successful' or 'failed'
    const { data: transaction, error } = await adminSupabase
      .from('transactions')
      .select('tx_ref, created_at, amount, status')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[check-pending] DB error:', error.message);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!transaction) {
      // No pending transaction found
      return NextResponse.json({ tx_ref: null });
    }

    // 3. Safety check: only allow re-verification of transactions from the last 72 hours
    // This covers weekend delays and slow mobile money networks while blocking stale reactivation
    const txAge = Date.now() - new Date(transaction.created_at).getTime();
    const seventyTwoHours = 72 * 60 * 60 * 1000;

    if (txAge > seventyTwoHours) {
      console.warn(`[check-pending] User ${user.id} tried to verify old tx (${transaction.tx_ref}), age: ${Math.round(txAge / 3600000)}h - too old`);
      return NextResponse.json({ tx_ref: null, reason: 'too_old' });
    }

    return NextResponse.json({ tx_ref: transaction.tx_ref });

  } catch (err) {
    console.error('[check-pending] Unexpected error:', err?.message || err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
