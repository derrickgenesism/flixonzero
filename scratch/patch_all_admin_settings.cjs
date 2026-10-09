const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // We only want to patch Server Components or API routes, not Client Components.
    // Fortunately, all files listed are server-side.
    
    // Most use: const supabase = await createClient()
    // We want to add: const { createAdminClient } = require('@/utils/supabase/admin'); const supabaseAdmin = createAdminClient();
    // And replace supabase.from('admin_settings') with supabaseAdmin.from('admin_settings')
    
    if (content.includes("from('admin_settings')") && !content.includes("createAdminClient = require")) {
      content = "const { createAdminClient } = require('@/utils/supabase/admin');\n" + content;
      content = content.replace(/supabase\s*\.\s*from\('admin_settings'\)/g, "createAdminClient().from('admin_settings')");
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log('Patched', filePath);
    }
  } catch (e) {
    console.error('Failed on', filePath, e);
  }
}

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

files.forEach(replaceInFile);
