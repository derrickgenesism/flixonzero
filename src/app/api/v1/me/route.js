import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET /api/v1/me
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ data: null, error: 'Unauthorized', meta: null }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', user.email)
      .single();

    const isActive = profile?.subscription_end_date &&
      new Date(profile.subscription_end_date) > new Date();

    const daysLeft = isActive
      ? Math.ceil((new Date(profile.subscription_end_date) - new Date()) / (1000 * 60 * 60 * 24))
      : 0;

    return NextResponse.json({
      data: {
        id: user.id,
        email: user.email,
        username: profile?.username,
        avatar: profile?.avatar,
        ref_code: profile?.ref_code,
        genre_preferences: profile?.genre_preferences || [],
        onboarding_done: profile?.onboarding_done || false,
        plan_type: profile?.plan_type || 'free',
        subscription: {
          is_active: isActive,
          days_left: daysLeft,
          end_date: profile?.subscription_end_date || null
        }
      },
      error: null,
      meta: null
    });
  } catch (err) {
    return NextResponse.json({ data: null, error: err.message, meta: null }, { status: 500 });
  }
}
