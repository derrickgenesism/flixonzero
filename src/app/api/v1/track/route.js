import { createAdminClient } from '@/utils/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { visitor_id, session_id, path, referrer, user_agent, user_id } = body || {};

    if (!visitor_id || !session_id || !path) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Never track admin pages or API routes to save database space & Vercel compute
    if (path.startsWith('/admin') || path.startsWith('/api')) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const supabase = createAdminClient();

    // Fast direct insert via service role — zero extra auth server roundtrips
    const { error } = await supabase.from('site_visits').insert({
      visitor_id,
      session_id,
      user_id: user_id || null,
      path: path.slice(0, 500),
      referrer: referrer ? referrer.slice(0, 500) : null,
      user_agent: user_agent ? user_agent.slice(0, 500) : null
    });

    if (error) {
      console.error('Track error:', error.message);
      return NextResponse.json({ error: 'Failed to record visit' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Track exception:', err.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
