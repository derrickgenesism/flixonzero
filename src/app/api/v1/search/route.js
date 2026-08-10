import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/v1/search?q=...
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q     = searchParams.get('q') || '';
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));

    if (!q.trim()) {
      return NextResponse.json({ data: [], error: null, meta: { total: 0 } });
    }

    const { data, error, count } = await supabase
      .from('movies')
      .select('id, title, type, thumbnail_url, categories, imdb_rating, runtime, created_at', { count: 'exact' })
      .or(`title.ilike.%${q}%,director.ilike.%${q}%`)
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      data: data || [],
      error: null,
      meta: { total: count, query: q }
    });
  } catch (err) {
    return NextResponse.json({ data: null, error: err.message, meta: null }, { status: 500 });
  }
}
