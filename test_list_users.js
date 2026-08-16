import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  // Let's get all users
  let allUsers = [];
  let page = 1;
  while(true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) {
      console.error(error);
      break;
    }
    if (!data || !data.users || data.users.length === 0) break;
    allUsers.push(...data.users);
    if (data.users.length < 1000) break;
    page++;
  }
  
  console.log('Total users:', allUsers.length);
}
run()
