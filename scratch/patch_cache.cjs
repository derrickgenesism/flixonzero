const fs = require('fs');
let file = 'src/lib/cache.js';
let content = fs.readFileSync(file, 'utf8');

// Replace getAnonClient() with createAdminClient() for the settings fetch
content = content.replace(
  "const { data } = await getAnonClient().from('admin_settings').select('*');",
  "const { createAdminClient } = require('@/utils/supabase/admin');\n      const adminClient = createAdminClient();\n      const { data } = await adminClient.from('admin_settings').select('*');"
);

fs.writeFileSync(file, content);
console.log('Patched cache.js to use Admin Client for settings');
