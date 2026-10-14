import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sendMovieRequestAlerts } from '@/lib/requestNotifier';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { title, year, poster_url, vj, notes, media_type, user_email, username } = body || {};

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Please provide a movie or series title.' }, { status: 400 });
    }

    if (!vj || !vj.trim()) {
      return NextResponse.json({ error: 'Please choose your preferred VJ or language translation.' }, { status: 400 });
    }

    const requesterEmail = user?.email || user_email || 'guest@flixon.net';
    const requesterName = username || user?.user_metadata?.username || (requesterEmail.split('@')[0]) || 'User';

    // Dispatch alerts (Telegram + Email to mutyabaderrick77@gmail.com + Support thread in DB)
    await sendMovieRequestAlerts({
      title: title.trim(),
      year: year ? String(year).trim() : null,
      posterUrl: poster_url || null,
      vj: vj.trim(),
      notes: notes?.trim() || null,
      mediaType: media_type === 'series' ? 'series' : 'movie',
      userEmail: requesterEmail,
      username: requesterName,
      userId: user?.id || null
    });

    return NextResponse.json({
      success: true,
      message: `🎬 Great! Your request for "${title.trim()}" has been submitted to the FlixOn upload desk.`
    });
  } catch (err) {
    console.error('[movie-requests POST error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit request' }, { status: 500 });
  }
}
