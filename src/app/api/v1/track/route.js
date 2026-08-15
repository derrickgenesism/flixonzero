import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { visitor_id, session_id, path, referrer, user_agent } = body;

    if (!visitor_id || !session_id || !path) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Insert visit record
    // Using service role to bypass RLS if anon insert isn't enough, but anon insert is enabled
    const { error } = await supabase.from('site_visits').insert({
      visitor_id,
      session_id,
      user_id: user ? user.id : null,
      path,
      referrer,
      user_agent
    });

    if (error) {
      console.error('Analytics tracking error:', error);
      return NextResponse.json({ error: 'Failed to log visit' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking exception:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
