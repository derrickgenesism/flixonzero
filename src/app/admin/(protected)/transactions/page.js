import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import TransactionsClient from './TransactionsClient';

export default async function AdminTransactionsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('email', user.email)
    .single();

  if (profile?.role !== 'administrator') {
    return (
      <div>
        <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>Access Denied</h1>
        <p style={{ color: 'var(--text2)' }}>You do not have permission to view transactions.</p>
      </div>
    );
  }

  // Fetch all transactions
  const { data: rawTransactions, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });

  let transactions = [];
  if (rawTransactions && rawTransactions.length > 0) {
    const { createClient: createAdminClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const userIds = [...new Set(rawTransactions.map(t => t.user_id))];
    
    // Fetch emails securely from auth.users using admin API
    const userEmails = {};
    for (const uid of userIds) {
      const { data } = await supabaseAdmin.auth.admin.getUserById(uid);
      if (data?.user?.email) {
        userEmails[uid] = data.user.email;
      }
    }

    transactions = rawTransactions.map(tx => {
      return {
        ...tx,
        user_profiles: userEmails[tx.user_id] ? { email: userEmails[tx.user_id] } : null
      };
    });
  }

  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>Transactions</h1>
      <p style={{ color: 'var(--text2)', marginBottom: '30px' }}>
        Monitor payment statuses and manually approve pending transactions if needed.
      </p>

      {error ? (
        <div style={{ background: 'rgba(229, 9, 20, 0.1)', color: '#e50914', padding: '15px', borderRadius: '6px' }}>
          Failed to load transactions.
        </div>
      ) : (
        <TransactionsClient initialTransactions={transactions || []} />
      )}
    </div>
  );
}
