require('dotenv').config({ path: '.env.local' });

async function main() {
  const sql = `
  ALTER TABLE movies ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT false;
  ALTER TABLE movies ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;
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
  console.log("Response:", res.status, await res.text());
}
main();
