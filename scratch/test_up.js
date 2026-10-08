import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data } = await supabase.from('user_profiles').select('*').limit(2);
  console.log('user_profiles columns:', Object.keys(data[0]));
  console.log('sample:', JSON.stringify(data[0]));
}
test();
