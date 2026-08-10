require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function main() {
  const sql = `
  CREATE TABLE IF NOT EXISTS watch_history (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    progress_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, movie_id)
  );

  CREATE INDEX IF NOT EXISTS idx_watch_history_user ON watch_history(user_id, updated_at DESC);
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
