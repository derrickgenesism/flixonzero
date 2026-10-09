const fs = require('fs');
let file = 'src/app/admin/(protected)/settings/page.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const supabase = await createClient()",
  "const { createAdminClient } = require('@/utils/supabase/admin');\n  const supabase = createAdminClient()"
);

fs.writeFileSync(file, content);
console.log('Patched admin settings page to use Admin Client');
