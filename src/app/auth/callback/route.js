import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  let next = requestUrl.searchParams.get('next') ?? '/';
  if (next.startsWith('http://') || next.startsWith('https://') || next.startsWith('//')) {
    next = '/';
  }

  if (code) {
    const supabase = await createClient()
    const { data: authSession, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check for affiliate referral cookie attribution
      try {
        const refCode = request.cookies.get('affiliate_ref')?.value?.trim();
        const user = authSession?.user || (await supabase.auth.getUser())?.data?.user;

        if (refCode && user?.email) {
          const admin = createAdminClient();
          const cleanEmail = user.email.toLowerCase().trim();

          // Check if profile already has a referrer
          const { data: profile } = await admin
            .from('user_profiles')
            .select('id, referred_by')
            .eq('email', cleanEmail)
            .maybeSingle();

          if (profile && !profile.referred_by) {
            const { data: affiliate } = await admin
              .from('affiliates')
              .select('id, user_id, status')
              .ilike('referral_code', refCode)
              .maybeSingle();

            if (affiliate && (affiliate.status === 'approved' || !affiliate.status)) {
              if (affiliate.user_id !== profile.id) {
                await admin
                  .from('user_profiles')
                  .update({ referred_by: affiliate.id })
                  .eq('id', profile.id);
              }
            }
          }
        }
      } catch (attErr) {
        console.warn('[auth/callback] Referral attribution warning:', attErr?.message || attErr);
      }

      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(new URL('/login?error=auth', request.url))
}
