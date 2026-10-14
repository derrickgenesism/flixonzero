import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const rawCode = resolvedParams?.code || '';
  const cleanCode = String(rawCode).trim().toLowerCase();

  const url = new URL(request.url);
  const redirectTo = url.searchParams.get('to') || '/';
  
  // Destination URL with ?ref preserved
  const destinationUrl = new URL(redirectTo, request.url);
  if (cleanCode) {
    destinationUrl.searchParams.set('ref', cleanCode);
  }

  const response = NextResponse.redirect(destinationUrl);

  if (cleanCode) {
    // Set 30-day referral attribution cookie
    const maxAge = 60 * 60 * 24 * 30; // 30 days
    response.cookies.set('affiliate_ref', cleanCode, {
      path: '/',
      maxAge,
      sameSite: 'lax',
      httpOnly: false, // accessible to client scripts as well
    });
  }

  return response;
}
