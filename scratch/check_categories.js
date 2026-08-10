require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function main() {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from('movies')
    .select('categories')
    .limit(1);

  if (error) {
    console.error("Error checking categories column:", error.message);
  } else {
    console.log("Success! Categories column exists.", data);
  }
}
main();
