import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET /api/v1/me/favorites  — returns user's favorited movies
// POST /api/v1/me/favorites — add a favorite { movieId }
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const { data: favorites } = await supabase
      .from('favorites')
      .select(`movie_id, created_at, movies(id, title, type, thumbnail_url, categories)`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      data: favorites?.map(f => ({ ...f.movies, favorited_at: f.created_at })) || [],
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

    const { movieId } = await request.json();
    if (!movieId) return NextResponse.json({ data: null, error: 'Missing movieId' }, { status: 400 });

    await supabase.from('favorites').upsert({ user_id: user.id, movie_id: movieId });
    return NextResponse.json({ data: { movieId }, error: null, meta: null });
  } catch (err) {
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const { movieId } = await request.json();
    await supabase.from('favorites').delete().eq('user_id', user.id).eq('movie_id', movieId);
    return NextResponse.json({ data: { movieId }, error: null, meta: null });
  } catch (err) {
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
