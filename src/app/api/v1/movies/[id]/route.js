/**
 * GET /api/v1/movies/[id]
 * Returns full movie detail including ratings, cast, etc.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const { data: movie, error } = await supabase
      .from('movies')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !movie) {
      return NextResponse.json({ data: null, error: 'Movie not found', meta: null }, { status: 404 });
    }

    // Fetch average rating
    const { data: ratingData } = await supabase
      .from('ratings')
      .select('rating')
      .eq('movie_id', id);

    const avgRating = ratingData?.length
      ? (ratingData.reduce((sum, r) => sum + r.rating, 0) / ratingData.length).toFixed(1)
      : null;

    // Fetch approved reviews (with limited user info)
    const { data: reviews } = await supabase
      .from('ratings')
      .select('id, rating, review_text, created_at, user_id')
      .eq('movie_id', id)
      .not('review_text', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch more like this (same categories)
    const cats = Array.isArray(movie.categories) ? movie.categories : [];
    let moreLikeThis = [];
    if (cats.length > 0) {
      const { data: similar } = await supabase
        .from('movies')
        .select('id, title, type, thumbnail_url, categories, imdb_rating')
        .contains('categories', [cats[0]])
        .neq('id', id)
        .limit(10);
      moreLikeThis = similar || [];
    }

    // Don't expose real video URL
    const safeMovie = { ...movie };
    delete safeMovie.video_url;
    delete safeMovie.video_480p_url;
    delete safeMovie.video_720p_url;
    delete safeMovie.video_1080p_url;

    return NextResponse.json({
      data: {
        ...safeMovie,
        avg_rating: avgRating ? parseFloat(avgRating) : null,
        rating_count: ratingData?.length || 0,
        reviews: reviews || [],
        more_like_this: moreLikeThis
      },
      error: null,
      meta: null
    });
  } catch (err) {
    return NextResponse.json({ data: null, error: err.message, meta: null }, { status: 500 });
  }
}
