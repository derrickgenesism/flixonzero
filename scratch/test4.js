import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data: wh, error } = await supabase.from('watch_history').select('*').limit(1);
  console.log("watch_history data:", wh);
  console.log("watch_history error:", error);
}
test();
