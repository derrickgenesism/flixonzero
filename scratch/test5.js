import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data: up } = await supabase.from('user_profiles').select('*').limit(1);
  console.log("user_profiles keys:", Object.keys(up[0]));
}
test();
