import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/v1/series/[id]/episodes
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Get the parent series info
    const { data: series, error: seriesError } = await supabase
      .from('movies')
      .select('id, title, thumbnail_url, categories, type')
      .eq('id', id)
      .eq('type', 'gsm_series')
      .single();

    if (seriesError || !series) {
      return NextResponse.json({ data: null, error: 'Series not found', meta: null }, { status: 404 });
    }

    // Get episodes
    const { data: episodes, error: epError } = await supabase
      .from('series_episodes')
      .select('id, series_id, season_number, episode_number, title, description, thumbnail_url, duration_seconds, created_at')
      .eq('series_id', id)
      .order('season_number', { ascending: true })
      .order('episode_number', { ascending: true });

    if (epError) throw epError;

    // Group by season
    const seasons = {};
    for (const ep of (episodes || [])) {
      const s = ep.season_number || 1;
      if (!seasons[s]) seasons[s] = [];
      seasons[s].push(ep);
    }

    return NextResponse.json({
      data: {
        series,
        seasons,
        episode_count: episodes?.length || 0
      },
      error: null,
      meta: null
    });
  } catch (err) {
    return NextResponse.json({ data: null, error: err.message, meta: null }, { status: 500 });
  }
}
