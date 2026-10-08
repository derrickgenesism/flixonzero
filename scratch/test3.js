import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data: wh } = await supabase.from('watch_history').select('user_id, profile_id').limit(1);
  console.log("watch_history user_id:", typeof wh[0]?.user_id, wh[0]?.user_id);
  console.log("watch_history profile_id:", typeof wh[0]?.profile_id, wh[0]?.profile_id);
}
test();
