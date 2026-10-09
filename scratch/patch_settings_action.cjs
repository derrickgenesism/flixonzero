const fs = require('fs');
let file = 'src/app/admin/(protected)/settings/actions.js';
let content = fs.readFileSync(file, 'utf8');

const injection = `  const supabase = await createClient()

  // SECURITY PATCH: Verify admin status
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized");
  
  const { data: adminCheck } = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', user.email)
    .single();
    
  if (!adminCheck) throw new Error("Forbidden");`;

content = content.replace("  const supabase = await createClient()", injection);

fs.writeFileSync(file, content);
console.log('Patched server action security');
