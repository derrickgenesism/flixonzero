import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = {};

  try {
    result.cwd = process.cwd();
    result.nodeVersion = process.version;
    
    // Check .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    result.envFileExists = fs.existsSync(envPath);
    if (result.envFileExists) {
      const content = fs.readFileSync(envPath, 'utf8');
      result.hasSupabaseUrl = content.includes('NEXT_PUBLIC_SUPABASE_URL');
      result.hasServiceKey = content.includes('SUPABASE_SERVICE_ROLE_KEY');
    }

    // Check FFmpeg
    try {
      result.ffmpegPath = execSync('which ffmpeg 2>/dev/null || where ffmpeg 2>nul').toString().trim();
    } catch (e) {
      result.ffmpegError = e.message;
    }

    // Check PM2 status
    try {
      result.pm2Status = execSync('pm2 jlist 2>/dev/null || pm2 status 2>/dev/null').toString().trim();
    } catch (e) {
      result.pm2StatusError = e.message;
    }

    // Check compressor logs
    try {
      result.compressorLogs = execSync('pm2 logs flixon-compressor --lines 40 --nostream 2>/dev/null').toString().trim();
    } catch (e) {
      result.compressorLogsError = e.message;
    }

    // Test run compressor script directly for 2 seconds
    try {
      result.testRun = execSync(`node -e "
        if (typeof globalThis.WebSocket === 'undefined') {
          class MockWebSocket {
            constructor() {}
            addEventListener() {}
            removeEventListener() {}
            send() {}
            close() {}
          }
          globalThis.WebSocket = MockWebSocket;
        }
        require('dotenv').config({path: '${envPath.replace(/\\/g, '/')}'});
        const { createClient } = require('@supabase/supabase-js');
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        sb.from('admin_settings').upsert({
          setting_key: 'compressor_worker_last_ping',
          setting_value: Date.now().toString(),
        }, { onConflict: 'setting_key' }).then(res => {
          console.log('Direct test ping status:', res.status, res.error);
        });
      "`, { timeout: 8000 }).toString().trim();
    } catch (e) {
      result.testRunError = e.message;
    }

  } catch (err) {
    result.fatalError = err.message;
  }

  return NextResponse.json(result);
}
