import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.from('movies').select('*').not('is_trending', 'is', null).limit(1);
  console.log("Response:", data, error);
}
test();
