import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || !query.trim()) {
      return NextResponse.json({ results: [] });
    }

    const admin = createAdminClient();
    const { data: setting } = await admin
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'tmdb_api_key')
      .maybeSingle();

    const apiKey = setting?.setting_value?.trim();
    if (!apiKey) {
      return NextResponse.json({ results: [] });
    }

    const tmdbRes = await fetch(
      `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`,
      { next: { revalidate: 3600 } }
    );

    if (!tmdbRes.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await tmdbRes.json();
    const results = (data.results || [])
      .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
      .slice(0, 8)
      .map(item => {
        const isMovie = item.media_type === 'movie';
        const date = isMovie ? item.release_date : item.first_air_date;
        const year = date ? date.split('-')[0] : '';
        const title = isMovie ? item.title : item.name;

        return {
          tmdb_id: item.id,
          media_type: isMovie ? 'movie' : 'series',
          title: title || 'Untitled',
          year: year || '',
          overview: item.overview || '',
          poster_url: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        };
      });

    return NextResponse.json({ results });
  } catch (err) {
    console.error('[TMDB Search Error]:', err);
    return NextResponse.json({ results: [] });
  }
}
