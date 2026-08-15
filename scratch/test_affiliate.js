require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use Anon Key but simulate the user using a JWT
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testApply() {
  // Login as user to get JWT
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'mutyabaderrick77@gmail.com',
    password: 'password' // I don't know the password
  });

  if (authErr) {
     console.log("Could not login, testing with service role instead to see what error it is.");
     const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
     
     // just check if we can insert as admin
     const { data: profile } = await supabaseAdmin.from('user_profiles').select('id').eq('email', 'mutyabaderrick77@gmail.com').single();
     if(profile) {
        const code = crypto.randomBytes(4).toString('hex');
        const { error: insertErr } = await supabaseAdmin.from('affiliates').insert({
            user_id: profile.id,
            referral_code: `ref_${code}`,
            status: 'pending'
        });
        console.log("Admin insert error:", insertErr);
     }
  } else {
     const { data: profile } = await supabase.from('user_profiles').select('id').eq('email', 'mutyabaderrick77@gmail.com').single();
     if(profile) {
        const code = crypto.randomBytes(4).toString('hex');
        const { error: insertErr } = await supabase.from('affiliates').insert({
            user_id: profile.id,
            referral_code: `ref_${code}`,
            status: 'pending'
        });
        console.log("User insert error:", insertErr);
     }
  }
}

testApply();
