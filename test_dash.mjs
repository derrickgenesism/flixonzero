import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: history, error } = await supabase
    .from('watch_history')
    .select('user_id, movie_id, movies(title, type, thumbnail_url), user_profiles(email)')
    .limit(5);

  if (error) {
    console.error("Error fetching history:", error);
  } else {
    console.log("History length:", history?.length);
  }
}
check();
