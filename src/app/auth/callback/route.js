import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  let next = requestUrl.searchParams.get('next') ?? '/';
  if (next.startsWith('http://') || next.startsWith('https://') || next.startsWith('//')) {
    next = '/';
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(new URL('/login?error=auth', request.url))
}

