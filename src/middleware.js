import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { getClientIpFromHeaders, isIpBlocked } from "@/lib/ipShield";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Bypass checks for internal and essential endpoints
  const isExcluded =
    pathname.startsWith('/ip-blocked') ||
    pathname.startsWith('/support') ||
    pathname.startsWith('/api/support') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/v1/track') ||
    pathname.startsWith('/admin');

  const clientIp = getClientIpFromHeaders(request.headers);

  // 2. Blacklisted IP Enforcement (Only explicitly banned IPs are blocked — zero stress for normal users)
  if (!isExcluded) {
    try {
      const blocked = await isIpBlocked(clientIp);
      if (blocked) {
        return NextResponse.redirect(new URL('/ip-blocked', request.url));
      }
    } catch (err) {
      console.warn('[Middleware] IP block check fail-open:', err?.message);
    }
  }

  // 4. Supabase Session Refresh
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static media files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
