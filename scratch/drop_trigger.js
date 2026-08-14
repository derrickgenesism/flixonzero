require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  // Drop the trigger
  const { error } = await supabase.rpc('execute_sql', { sql_query: 'DROP TRIGGER IF EXISTS trg_create_default_support_thread ON user_profiles;' });
  console.log('Drop error:', error);
}

test();
