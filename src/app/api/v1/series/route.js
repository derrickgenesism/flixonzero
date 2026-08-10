import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/v1/series
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page  = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('movies')
      .select('id, title, thumbnail_url, categories, view_count, imdb_rating, created_at', { count: 'exact' })
      .eq('type', 'gsm_series')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      data,
      meta: { total: count, page, limit, totalPages: Math.ceil((count || 0) / limit) },
      error: null
    });
  } catch (err) {
    return NextResponse.json({ data: null, error: err.message, meta: null }, { status: 500 });
  }
}
