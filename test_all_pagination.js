import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function testAll() {
  const { data: profiles } = await supabase.from('user_profiles').select('email, id')
  console.log(`Testing ${profiles.length} profiles...`)
  
  // Let's test the search logic for a few profiles
  for (let i = 0; i < Math.min(profiles.length, 10); i++) {
    const profile = profiles[i];
    console.log(`Profile: ${profile.email}`);
    
    let authUser = null;
    if (profile.email) {
      let page = 1;
      let found = false;
      while (!found) {
        console.log(`Querying page ${page}...`);
        const { data: listData, error: listError } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
        if (listError) {
          console.error('List error:', listError);
          break;
        }
        if (!listData?.users || listData.users.length === 0) {
          console.log('No users returned');
          break;
        }
        
        console.log(`Page ${page} returned ${listData.users.length} users`);
        const match = listData.users.find(u => u.email === profile.email);
        if (match) {
          authUser = match;
          found = true;
          console.log('Found!');
          break;
        }
        
        if (listData.users.length < 1000) {
          console.log('Last page reached');
          break; // Last page
        }
        page++;
      }
    }
  }
}

testAll()
