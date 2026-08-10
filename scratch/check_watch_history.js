require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase
    .from('watch_history')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Success! Table exists.", data);
  }
}
main();
