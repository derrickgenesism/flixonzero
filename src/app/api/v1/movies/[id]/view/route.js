import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST /api/v1/movies/[id]/view  (fire-and-forget)
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    await supabase.rpc('increment_view_count', { p_movie_id: Number(id) });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
