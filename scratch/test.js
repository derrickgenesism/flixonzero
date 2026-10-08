import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data: tx } = await supabase.from('transactions').select('user_id').limit(1);
  const { data: up } = await supabase.from('user_profiles').select('id').limit(1);
  console.log("Transaction user_id type:", typeof tx[0]?.user_id, tx[0]?.user_id);
  console.log("User Profile id type:", typeof up[0]?.id, up[0]?.id);
}
test();
