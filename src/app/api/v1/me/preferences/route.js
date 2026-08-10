import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// POST /api/v1/me/preferences  { genres: string[] }
export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { genres } = await request.json();

    await supabase
      .from('user_profiles')
      .update({
        genre_preferences: genres || [],
        onboarding_done: true
      })
      .eq('email', user.email);

    return NextResponse.json({ data: { success: true }, error: null });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
