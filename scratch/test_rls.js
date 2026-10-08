import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
  const { data: movies, error: mErr } = await supabase.from('movies').select('id').limit(1);
  console.log('movies public access:', !!movies?.length, mErr);
  const { data: settings, error: sErr } = await supabase.from('admin_settings').select('id').limit(1);
  console.log('settings public access:', !!settings?.length, sErr);
}
test();
