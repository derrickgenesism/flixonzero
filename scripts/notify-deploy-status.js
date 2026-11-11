const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load environment variables across VPS and local dev
const envPaths = [
  path.resolve(__dirname, '..', '.env.local'),
  path.resolve(__dirname, '..', '.env'),
  '/var/www/flixon/.env.local',
  path.resolve(process.cwd(), '.env.local'),
];
for (const p of envPaths) {
  if (fs.existsSync(p)) {
    require('dotenv').config({ path: p });
  }
}

const status = process.argv[2] || 'ready'; // 'building' | 'ready' | 'failed'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.log('⚠️ [Deploy Status] Supabase credentials not found in env, skipping status update.');
  process.exit(0);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, serviceKey);

let commit = 'unknown';
let message = 'Build update';
try {
  commit = execSync('git rev-parse --short HEAD').toString().trim();
  message = execSync('git log -1 --pretty=%s').toString().trim();
} catch (_) {}

const now = new Date();
const timeEAT = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Kampala',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
}).format(now) + ' EAT';

const payload = {
  status, // 'building' | 'ready' | 'failed'
  commit,
  message,
  timeEAT,
  timestamp: now.toISOString(),
};

supabase
  .from('admin_settings')
  .upsert(
    {
      setting_key: 'deployment_status_live',
      setting_value: JSON.stringify(payload),
    },
    { onConflict: 'setting_key' }
  )
  .then(({ error }) => {
    if (error) {
      console.error('❌ [Deploy Status Error]', error.message);
    } else {
      console.log(`✅ [Deploy Status] Updated to "${status}" for commit #${commit}: "${message}"`);
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ [Deploy Status Exception]', err.message);
    process.exit(0);
  });
