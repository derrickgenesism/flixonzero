import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { count } = await supabase.from('site_visits').select('id', { count: 'exact', head: true });
  console.log("site_visits count:", count);
}
test();
