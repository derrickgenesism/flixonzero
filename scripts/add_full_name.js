const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { error } = await supabase.rpc('exec_sql', {
    sql_string: `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;`
  });
  
  if (error) {
    console.log("RPC exec_sql failed or doesn't exist. We'll rely on Prisma/SQL manually if needed, or just skip full_name for now.");
    console.log(error);
  } else {
    console.log("Added full_name column to user_profiles!");
  }
}

run();
