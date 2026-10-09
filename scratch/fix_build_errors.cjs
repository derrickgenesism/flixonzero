const fs = require('fs');
const files = [
  'src/app/not-found.js',
  'src/app/account/page.js',
  'src/app/admin/(protected)/affiliates/actions.js',
  'src/app/admin/(protected)/backups/actions.js',
  'src/app/admin/(protected)/backups/page.js',
  'src/app/admin/(protected)/homepage/actions.js',
  'src/app/admin/(protected)/homepage/page.js',
  'src/app/admin/(protected)/movies/add/actions.js',
  'src/app/admin/(protected)/movies/cloudflare-import/page.js',
  'src/app/admin/(protected)/movies/compress-existing/actions.js',
  'src/app/admin/(protected)/movies/upload/actions.js',
  'src/app/admin/(protected)/settings/actions.js',
  'src/app/admin/(protected)/settings/page.js',
  'src/app/admin/(protected)/support/actions.js',
  'src/app/admin/(protected)/tmdb/page.js',
  'src/app/api/admin/warm-reminder/route.js',
  'src/app/api/affiliates/track/route.js',
  'src/app/api/r2-presign/route.js',
  'src/app/api/upload-direct/route.js',
  'src/app/api/v1/backups/cron/route.js',
  'src/app/api/video/download/route.js',
  'src/app/api/video/token/route.js',
  'src/app/api/webhooks/flutterwave/route.js',
  'src/app/checkout/actions.js',
  'src/app/checkout/page.js',
  'src/app/profiles/actions.js',
  'src/app/profiles/checkoutActions.js',
  'src/app/profiles/page.js',
  'src/app/series/page.js',
  'src/components/Navbar.js'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Fix the "use server" issue
  if (content.includes("const { createAdminClient } = require('@/utils/supabase/admin');\n'use server'")) {
    content = content.replace("const { createAdminClient } = require('@/utils/supabase/admin');\n'use server'", "'use server'\nconst { createAdminClient: _injectedAdminClient } = require('@/utils/supabase/admin');");
  } else if (content.includes("const { createAdminClient } = require('@/utils/supabase/admin');\n\"use server\"")) {
    content = content.replace("const { createAdminClient } = require('@/utils/supabase/admin');\n\"use server\"", "\"use server\"\nconst { createAdminClient: _injectedAdminClient } = require('@/utils/supabase/admin');");
  } else {
    // Just rename the require
    content = content.replace("const { createAdminClient } = require('@/utils/supabase/admin');", "const { createAdminClient: _injectedAdminClient } = require('@/utils/supabase/admin');");
  }

  // Rename the usage
  content = content.replace(/createAdminClient\(\)\.from\('admin_settings'\)/g, "_injectedAdminClient().from('admin_settings')");

  if (content !== original) {
    fs.writeFileSync(file, content);
  }
});
console.log('Fixed build errors');
