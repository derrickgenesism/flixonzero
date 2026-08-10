require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const email = 'genesis8017@gmail.com';
  const password = 'Genesis8017688888@';
  
  console.log('Finding user profile for email:', email);
  const { data: profile, error: profileErr } = await s.from('user_profiles').select('id').eq('email', email).single();
  
  if (profile) {
    console.log('Found user:', profile.id);
    const { error: updateErr } = await s.auth.admin.updateUserById(profile.id, { password, email_confirm: true });
    if (updateErr) console.error('Error updating password:', updateErr);
    else console.log('Updated password successfully');
    
    await new Promise(r => setTimeout(r, 1000));
    
    const { error: pErr } = await s.from('user_profiles').update({ is_admin: true }).eq('id', profile.id);
    if (pErr) console.error('Error updating profile is_admin:', pErr);
    else console.log('Updated existing user to admin');
  } else {
    console.log('User profile not found. Trying to create...');
    const { data, error } = await s.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) {
      console.error(error);
      return;
    }
    await new Promise(r => setTimeout(r, 1000));
    await s.from('user_profiles').update({ is_admin: true }).eq('id', data.user.id);
    console.log('Created new admin user');
  }
}

run();
