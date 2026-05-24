import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const errorParam = requestUrl.searchParams.get('error_description')

  if (errorParam) {
    const loginUrl = new URL('/auth/login', requestUrl.origin)
    loginUrl.searchParams.set('error', errorParam)
    return NextResponse.redirect(loginUrl)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL('/auth/update-password', requestUrl.origin))
    }
    const loginUrl = new URL('/auth/login', requestUrl.origin)
    loginUrl.searchParams.set('error', error.message)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.redirect(new URL('/auth/reset-password', requestUrl.origin))
}
