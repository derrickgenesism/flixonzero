require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Must use the anon key or service role to signup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testSignup() {
  const email = 'test_signup_' + Date.now() + '@example.com';
  
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: 'password123'
  });

  console.log('Result:', data);
  if (error) {
    console.error('Signup Error:', error);
  } else {
    console.log('Signup successful!');
  }
}

testSignup();
