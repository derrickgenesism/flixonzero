const fs = require('fs');

const adminCheckReplacement = `  const { data: adminCheck } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('email', user.email)
    .single();
    
  if (adminCheck?.role !== 'administrator') throw new Error("Forbidden");`;

const oldAdminCheck = /  const \{ data: adminCheck \} = await supabase\r?\n\s*\.from\('admin_users'\)\r?\n\s*\.select\('id'\)\r?\n\s*\.eq\('email', user\.email\)\r?\n\s*\.single\(\);\r?\n\s*\r?\n\s*if \(\!adminCheck\) throw new Error\("Forbidden"\);/;

// 1. Settings Actions
let settingsActions = fs.readFileSync('src/app/admin/(protected)/settings/actions.js', 'utf8');
settingsActions = settingsActions.replace(oldAdminCheck, adminCheckReplacement);
fs.writeFileSync('src/app/admin/(protected)/settings/actions.js', settingsActions);

// 2. Warm Reminder Route
let warmRoute = fs.readFileSync('src/app/api/admin/warm-reminder/route.js', 'utf8');
warmRoute = warmRoute.replace(
  "const { data: adminCheck } = await supabase.from('admin_users').select('id').eq('email', user.email).single();\n    if (!adminCheck) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });",
  "const { data: adminCheck } = await supabase.from('user_profiles').select('role').eq('email', user.email).single();\n    if (adminCheck?.role !== 'administrator') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });"
);
fs.writeFileSync('src/app/api/admin/warm-reminder/route.js', warmRoute);

// 3. Compression Cancel Route
let compRoute = fs.readFileSync('src/app/api/compression-jobs/[id]/cancel/route.js', 'utf8');
compRoute = compRoute.replace(
  "const { data: adminCheck } = await supabase.from('admin_users').select('id').eq('email', user.email).single();\n    if (!adminCheck) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });",
  "const { data: adminCheck } = await supabase.from('user_profiles').select('role').eq('email', user.email).single();\n    if (adminCheck?.role !== 'administrator') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });"
);
fs.writeFileSync('src/app/api/compression-jobs/[id]/cancel/route.js', compRoute);

console.log('Fixed broken admin_users checks');
