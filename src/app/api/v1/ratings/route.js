import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// POST /api/v1/ratings — { movieId, rating, reviewText }
export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const { movieId, rating, reviewText } = await request.json();
    if (!movieId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ data: null, error: 'Invalid rating' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('ratings')
      .upsert({
        movie_id: movieId,
        user_id: user.id,
        rating,
        review_text: reviewText || null
      }, { onConflict: 'movie_id,user_id' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data, error: null, meta: null });
  } catch (err) {
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
