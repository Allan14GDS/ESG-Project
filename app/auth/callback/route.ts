import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  const type = requestUrl.searchParams.get('type')

  console.log('[v0] Auth callback triggered', { code: !!code, type, next })

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('[v0] Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/auth/login?error=invalid_code', requestUrl.origin))
    }

    console.log('[v0] Successfully exchanged code for session')

    // If this is a password recovery, redirect to reset password page
    if (type === 'recovery') {
      console.log('[v0] Password recovery detected, redirecting to reset password')
      return NextResponse.redirect(new URL('/auth/reset-password', requestUrl.origin))
    }

    // Otherwise redirect to the dashboard or specified next URL
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }

  console.log('[v0] No code found, redirecting to login')
  // If no code, redirect to login
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin))
}
