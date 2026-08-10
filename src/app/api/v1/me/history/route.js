import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET /api/v1/me/history
// POST /api/v1/me/progress  — { movieId, progressSeconds, durationSeconds }
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const { data: history } = await supabase
      .from('watch_history')
      .select(`movie_id, progress_seconds, updated_at, movies(id, title, type, thumbnail_url)`)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50);

    return NextResponse.json({
      data: history?.map(h => ({
        ...h.movies,
        progress_seconds: h.progress_seconds,
        last_watched: h.updated_at
      })) || [],
      error: null, meta: null
    });
  } catch (err) {
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const { movieId, progressSeconds } = await request.json();
    if (!movieId) return NextResponse.json({ data: null, error: 'Missing movieId' }, { status: 400 });

    await supabase.from('watch_history').upsert({
      user_id: user.id,
      movie_id: movieId,
      progress_seconds: progressSeconds || 0,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,movie_id' });

    return NextResponse.json({ data: { movieId, progressSeconds }, error: null, meta: null });
  } catch (err) {
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
