import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getDownloadsAnalytics } from '@/lib/downloadsAnalytics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = createAdminClient();
    const analytics = await getDownloadsAnalytics(admin);
    return NextResponse.json(analytics);
  } catch (err) {
    console.error('API /api/admin/shared-apps/analytics error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
