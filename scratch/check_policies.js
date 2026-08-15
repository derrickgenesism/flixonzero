require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: policies, error: pErr } = await supabase
        .from('pg_policies')
        .select('*');
    
    // Fallback: use raw sql via rpc if pg_policies is not exposed
    if (pErr) {
        console.error("pg_policies error:", pErr.message);
    } else {
        const affiliatePolicies = policies?.filter(p => p.tablename === 'affiliates');
        console.log("Affiliates policies:", affiliatePolicies);
    }
}

check();
