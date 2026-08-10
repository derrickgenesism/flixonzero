import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cleanCategories } from '@/utils/categories';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/v1/categories — returns all unique categories with movie counts
export async function GET() {
  try {
    const { data: movies, error } = await supabase
      .from('movies')
      .select('categories');

    if (error) throw error;

    const counts = {};
    for (const movie of (movies || [])) {
      const cleanCats = cleanCategories(movie.categories);
      for (const cat of cleanCats) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    }

    const categories = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ data: categories, error: null, meta: { total: categories.length } });
  } catch (err) {
    return NextResponse.json({ data: null, error: err.message, meta: null }, { status: 500 });
  }
}
