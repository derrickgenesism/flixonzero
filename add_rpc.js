require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function main() {
  const sql = `
  CREATE OR REPLACE FUNCTION get_user_emails_by_ids(user_ids UUID[])
  RETURNS TABLE(id UUID, email VARCHAR) AS $$
  BEGIN
    RETURN QUERY
    SELECT au.id, au.email::VARCHAR
    FROM auth.users au
    WHERE au.id = ANY(user_ids);
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'apiKey': process.env.SUPABASE_SERVICE_ROLE_KEY
    },
    body: JSON.stringify({ query: sql })
  });
  console.log(await res.text());
}
main();
