require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data } = await supabase.from('admin_settings').select('*').eq('setting_key', 'flutterwave_public_key').single();
  console.log('Value is:', data?.setting_value);
}
check();
