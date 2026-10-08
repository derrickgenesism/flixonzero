import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data } = await supabase.from('transactions').select('*').limit(1);
  console.log('transactions columns:', Object.keys(data[0]));
  
  // Check how many unique users in history
  const { data: hist } = await supabase.from('watch_history').select('user_id').limit(1000);
  const uniqueIds = new Set(hist?.map(h => h.user_id));
  console.log('Unique user UUIDs in 1000 history rows:', uniqueIds.size);
  
  // Check if listUsers is available
  const { data: listData, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 10 });
  console.log('listUsers available:', !error, error?.message);
}
test();
