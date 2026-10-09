require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testLog() {
  const { data, error } = await supabase.from('security_logs').insert({
    event_type: 'SYSTEM_ACTIVATION',
    severity: 'LOW',
    description: 'Security Monitoring System successfully activated and database connected.',
    metadata: { status: 'online', tested_by: 'Antigravity AI' }
  });

  if (error) {
    console.error('Error inserting log:', error.message);
  } else {
    console.log('Successfully inserted test log!');
  }
}

testLog();
