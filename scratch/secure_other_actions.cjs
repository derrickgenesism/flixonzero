const fs = require('fs');

const injection = `  const supabase = await createClient()

  // SECURITY PATCH: Verify admin status
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized");
  
  const { data: adminCheck } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('email', user.email)
    .single();
    
  if (adminCheck?.role !== 'administrator') throw new Error("Forbidden");`;

let file = 'src/app/admin/(protected)/affiliates/actions.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace("  const supabase = await createClient()", injection);
fs.writeFileSync(file, content);

let file2 = 'src/app/admin/(protected)/support/actions.js';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace("  const supabase = createAdminClient();", `  const userSupa = await createClient();
  const { data: { user } } = await userSupa.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: adminCheck } = await userSupa.from('user_profiles').select('role').eq('email', user.email).single();
  if (adminCheck?.role !== 'administrator') throw new Error("Forbidden");
  const supabase = createAdminClient();`);
fs.writeFileSync(file2, content2);

console.log('Secured affiliates and support actions');
