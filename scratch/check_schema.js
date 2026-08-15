require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // Let's get the schema of user_profiles
  const { data, error } = await supabase.rpc('get_schema_info'); // if we don't have it, we'll just query a row
  
  const { data: row } = await supabase.from('user_profiles').select('*').limit(1).single();
  console.log("User profile row:", row);
}

check();
