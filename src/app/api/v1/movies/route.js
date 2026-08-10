/**
 * GET /api/v1/movies
 * 
 * Query params:
 *  - q: search string
 *  - category: filter by category
 *  - type: 'video' | 'gsm_series' | 'genesis_free_movie'
 *  - sort: 'newest' | 'oldest' | 'popular' | 'rating'
 *  - page: page number (default 1)
 *  - limit: items per page (default 20, max 100)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q        = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const type     = searchParams.get('type') || '';
    const sort     = searchParams.get('sort') || 'newest';
    const page     = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit    = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset   = (page - 1) * limit;

    let query = supabase
      .from('movies')
      .select('id, title, type, thumbnail_url, categories, view_count, imdb_rating, runtime, content_rating, language, created_at, release_date, is_coming_soon', { count: 'exact' });

    if (q)        query = query.or(`title.ilike.%${q}%,director.ilike.%${q}%`);
    if (category) query = query.contains('categories', [category]);
    if (type)     query = query.eq('type', type);

    switch (sort) {
      case 'popular': query = query.order('view_count', { ascending: false }); break;
      case 'rating':  query = query.order('imdb_rating', { ascending: false }); break;
      case 'oldest':  query = query.order('created_at', { ascending: true }); break;
      default:        query = query.order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      data,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      },
      error: null
    });
  } catch (err) {
    return NextResponse.json({ data: null, error: err.message, meta: null }, { status: 500 });
  }
}
