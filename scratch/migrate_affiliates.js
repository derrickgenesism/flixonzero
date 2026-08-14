require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrate() {
  const sql = `
    ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
    UPDATE affiliates SET status = 'approved' WHERE status = 'pending' OR status IS NULL;
  `;
  
  const { error } = await supabase.rpc('execute_sql', { sql_query: sql });
  if (error) {
    console.error('RPC execute_sql failed. Will use REST API directly if needed, but wait, execute_sql is not default.');
    console.log('Error:', error);
  }
}

migrate();
