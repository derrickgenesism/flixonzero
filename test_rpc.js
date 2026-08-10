require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const username = 'mutya'; // Adjust this to whatever username the user might be testing
  console.log('Testing lookup for:', username);
  const { data, error } = await supabase.rpc('get_email_by_username', { p_username: username });
  console.log('Result:', data, 'Error:', error);
  
  // also let's just query the table
  const { data: tableData } = await supabase.from('user_profiles').select('*').limit(5);
  console.log('Sample profiles:', tableData);
}

test();
