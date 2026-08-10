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

async function checkUser(emailToFind) {
  console.log(`Checking DB for email: ${emailToFind}`);
  
  // 1. Check user_profiles (case insensitive via ilike for checking)
  const { data: profile, error: profErr } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .ilike('email', emailToFind);
    
  console.log('user_profiles result:', profile);
  if (profErr) console.error('Profile error:', profErr);

  // 2. Check auth.users
  let foundUser = null;
  let page = 1;
  while (!foundUser) {
    const { data: { users }, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
    if (listErr || users.length === 0) break;
    foundUser = users.find(u => u.email.toLowerCase() === emailToFind.toLowerCase());
    page++;
  }
  
  console.log('auth.users result:', foundUser ? `Found User (ID: ${foundUser.id})` : 'Not Found in auth.users');
}

const email = process.argv[2] || 'test@example.com';
checkUser(email);
