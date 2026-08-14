require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const email = 'test_trigger_' + Date.now() + '@example.com';
  
  // Try inserting into user_profiles directly
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      email: email,
      username: 'Test User'
    })
    .select();

  console.log('Result:', data);
  if (error) {
    console.error('Error:', error);
  } else {
    // Check if support thread was created
    const { data: thread } = await supabase.from('support_threads').select('*').eq('user_id', data[0].id).single();
    console.log('Thread:', thread);
    
    // cleanup
    await supabase.from('user_profiles').delete().eq('email', email);
  }
}

test();
