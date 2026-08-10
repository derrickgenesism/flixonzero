import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET /api/v1/notifications
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('created_at', { ascending: false })
      .limit(30);

    return NextResponse.json({ data: data || [], error: null, meta: null });
  } catch (err) {
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}

// PATCH /api/v1/notifications — mark all as read
export async function PATCH() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    return NextResponse.json({ data: { success: true }, error: null, meta: null });
  } catch (err) {
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
