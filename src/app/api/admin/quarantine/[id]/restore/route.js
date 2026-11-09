import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const movieId = parseInt(id, 10);

    if (isNaN(movieId)) {
      return NextResponse.json({ error: 'Invalid movie ID' }, { status: 400 });
    }

    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('email', user.email)
      .maybeSingle();

    if (profile?.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admin = createAdminClient();

    // Verify movie is currently quarantined
    const { data: movie } = await admin
      .from('movies')
      .select('id, title, type, video_url')
      .eq('id', movieId)
      .maybeSingle();

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    if (movie.type !== 'broken_quarantine') {
      return NextResponse.json({ error: `Movie is not quarantined (type: ${movie.type})` }, { status: 400 });
    }

    // Restore: set type back to 'video'
    const { error } = await admin
      .from('movies')
      .update({ type: 'video' })
      .eq('id', movieId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, movieId, title: movie.title });
  } catch (err) {
    console.error('[Quarantine Restore Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
