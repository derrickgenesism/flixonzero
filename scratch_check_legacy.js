import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function check() {
  const { data: profiles } = await supabaseAdmin.from('user_profiles').select('email, legacy_migration').eq('legacy_migration', true).limit(5);
  console.log("Users requiring reset:", profiles);
}
check();
