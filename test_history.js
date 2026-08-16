import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const supabase = supabaseAdmin;

async function run() {
  const userId = '13'; // Or find a known profile ID. Wait, I'll query for a valid profile first.
  const { data: profiles, error: profileErr } = await supabase.from('user_profiles').select('*').limit(5)
  if (!profiles || profiles.length === 0) {
      console.log('No profiles found');
      return;
  }
  
  for (let profile of profiles) {
      console.log(`\nChecking profile: ${profile.email} (ID: ${profile.id})`);
      
      // My fix logic:
      let authUser = null;
      if (profile.email) {
        let page = 1;
        let found = false;
        while (!found) {
          const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
          if (listError || !listData?.users || listData.users.length === 0) break;
          
          const match = listData.users.find(u => u.email === profile.email);
          if (match) {
            authUser = match;
            found = true;
            break;
          }
          
          if (listData.users.length < 1000) break;
          page++;
        }
      }
      
      console.log('Auth user found?', !!authUser, authUser ? authUser.id : '');
      
      if (authUser) {
          const { data: watchHistory, error: watchError } = await supabase
            .from('watch_history')
            .select('*, movies(id, title)')
            .eq('user_id', authUser.id)
            .order('updated_at', { ascending: false })
            .limit(5);
            
          console.log('Watch History:', watchHistory?.length || 0, watchError ? watchError.message : '');
          if (watchHistory?.length > 0) {
              console.log('Sample watch history:', watchHistory[0]);
          }
      }
  }
}
run()
