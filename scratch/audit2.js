import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  // Check pending transactions from last 7 days that may be stuck
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: pending } = await supabase
    .from('transactions')
    .select('tx_ref, user_id, amount, plan_type, duration_days, created_at')
    .eq('status', 'pending')
    .gte('created_at', sevenDaysAgo)
    .order('created_at', { ascending: false });
  
  console.log('Pending transactions (last 7 days):', pending?.length || 0);
  if (pending?.length) console.log(JSON.stringify(pending, null, 2));
  
  // Check PPV purchases upsert issue: what happens if same user/movie tries twice?
  const { data: ppv } = await supabase
    .from('ppv_purchases')
    .select('user_id, movie_id, tx_ref, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log('Recent PPV purchases:', JSON.stringify(ppv, null, 2));
}
test();
