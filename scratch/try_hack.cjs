require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function tryHack() {
  const { data, error } = await supabase.from('admin_settings').update({ setting_value: 'hacked' }).eq('setting_key', 'flutterwave_public_key');
  console.log('Update Error:', error?.message || 'Success! No error!');
}
tryHack();
