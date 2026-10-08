import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  // Check recent transactions to see what plan_type looks like
  const { data: txs } = await supabase.from('transactions').select('tx_ref, plan_type, duration_days, status').order('created_at', { ascending: false }).limit(5);
  console.log('Recent transactions:', JSON.stringify(txs, null, 2));
  
  // Check subscription plans
  const { data: plans } = await supabase.from('subscription_plans').select('id, name, price, duration_days');
  console.log('Plans:', JSON.stringify(plans, null, 2));
}
test();
