require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function secureRLS() {
  const { error: e1 } = await supabase.rpc('exec_sql', { sql: `
    ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public Read Access" ON admin_settings;
    CREATE POLICY "Public Read Access" ON admin_settings FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "No Insert" ON admin_settings;
    CREATE POLICY "No Insert" ON admin_settings FOR INSERT WITH CHECK (false);
    
    DROP POLICY IF EXISTS "No Update" ON admin_settings;
    CREATE POLICY "No Update" ON admin_settings FOR UPDATE USING (false);
    
    DROP POLICY IF EXISTS "No Delete" ON admin_settings;
    CREATE POLICY "No Delete" ON admin_settings FOR DELETE USING (false);
  `});
  if (e1) console.log("exec_sql failed, trying postgres directly if possible", e1);
  else console.log("RLS Secured via exec_sql");
}
secureRLS();
