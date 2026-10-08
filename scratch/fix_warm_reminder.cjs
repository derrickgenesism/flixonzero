const fs = require('fs');
let file = 'src/app/api/admin/warm-reminder/route.js';
let content = fs.readFileSync(file, 'utf8');

const replacement = `import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// Protect this endpoint - Vercel cron sends the CRON_SECRET as a Bearer token.
// Manual calls from the admin UI POST with { manual: true } must have a valid admin session
async function isAuthorized(request) {
  // Vercel cron authorization header
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader === \`Bearer \${secret}\`) return true;

  // Manual trigger from admin UI requires an actual session
  if (request.method === 'POST') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // Check if user is admin
    const { data: adminCheck } = await supabase.from('admin_users').select('id').eq('email', user.email).single();
    if (adminCheck) return true;
  }

  return false;
}`;

content = content.replace(/import \{ createAdminClient \} from '@\/utils\/supabase\/admin';[\s\S]*?return false;\r?\n\}/, replacement);

// Update handler to await isAuthorized
content = content.replace(`  if (!isAuthorized(request)) {`, `  if (!(await isAuthorized(request))) {`);

fs.writeFileSync(file, content);
console.log('Fixed backdoor in warm-reminder');
