import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  const checks = {};
  let overallStatus = 'ok';

  // ── 1. App is alive (trivially true if we got here) ────────────
  checks.app = { status: 'ok' };

  // ── 2. Deployment info ─────────────────────────────────────────
  let deployInfo = {};
  try {
    const filePath = path.join(process.cwd(), 'public', 'deployment.json');
    if (fs.existsSync(filePath)) {
      deployInfo = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    checks.deployInfo = { status: 'ok', commit: deployInfo.commit || 'dev' };
  } catch {
    checks.deployInfo = { status: 'warn', message: 'deployment.json not found' };
  }

  // ── 3. Supabase reachability ────────────────────────────────────
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceKey) {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(supabaseUrl, serviceKey);
      // Lightweight query — just get 1 row to test DB connectivity
      const { error } = await sb.from('admin_settings').select('setting_key').limit(1);
      if (error) throw error;
      checks.database = { status: 'ok' };
    } else {
      checks.database = { status: 'warn', message: 'Supabase env vars not set' };
    }
  } catch (err) {
    checks.database = { status: 'error', message: err.message };
    overallStatus = 'degraded';
  }

  // ── 4. Temp / file system writable ─────────────────────────────
  try {
    const tmpFile = path.join(process.cwd(), 'temp', '.health_probe');
    fs.mkdirSync(path.dirname(tmpFile), { recursive: true });
    fs.writeFileSync(tmpFile, 'ok');
    fs.unlinkSync(tmpFile);
    checks.filesystem = { status: 'ok' };
  } catch (err) {
    checks.filesystem = { status: 'warn', message: err.message };
  }

  const responseTimeMs = Date.now() - startTime;
  const httpStatus = overallStatus === 'ok' ? 200 : 503;

  return NextResponse.json(
    {
      status: overallStatus,
      checks,
      responseTimeMs,
      timestamp: new Date().toISOString(),
      ...deployInfo,
    },
    { status: httpStatus }
  );
}
