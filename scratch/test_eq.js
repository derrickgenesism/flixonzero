import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
  try {
    const { data } = await supabase.from('user_profiles').select('id').eq('email', undefined);
    console.log("No error!");
  } catch (err) {
    console.error("Error:", err.message);
  }
}
test();
