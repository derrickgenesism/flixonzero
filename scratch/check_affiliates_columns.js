require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('affiliates').select('*').limit(1);
  if(error) {
     console.log("Error querying affiliates:", error);
  } else {
     console.log("Columns returned:", data.length > 0 ? Object.keys(data[0]) : "No data, but query succeeded");
     
     // Let's also check if we can insert something without status
     const { data: profile } = await supabase.from('user_profiles').select('id').limit(1).single();
     if(profile) {
         const { error: insErr } = await supabase.from('affiliates').insert({
             user_id: profile.id,
             referral_code: 'ref_test123'
         }).select();
         console.log("Insert without status error:", insErr);
     }
  }
}

check();
