import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
// Remove cookies import if no longer needed
// import { cookies } from 'next/headers'; 

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Remove 'next' parameter logic
  // const next = searchParams.get('next') || '/'; 

  console.log(`[Auth Callback Route] Received callback. Code: ${code ? 'present' : 'missing'}`);

  if (code) {
    const supabase = await createClient();
    try {
      console.log('[Auth Callback Route] Exchanging code for session...');
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error) {
        console.log('[Auth Callback Route] Code exchange successful. Redirecting to /auth/processing.');
        // Redirect to the processing page. AuthListener there will handle the final redirect.
        return NextResponse.redirect(`${origin}/auth/processing`);
      } else {
        console.error('[Auth Callback Route] Error exchanging code:', error.message);
        // Redirect to login page, maybe include error query params
        const loginUrl = new URL('/login', origin);
        loginUrl.searchParams.set('error', 'callback-error');
        loginUrl.searchParams.set('message', error.message);
        return NextResponse.redirect(loginUrl);
      }
    } catch (e: any) {
       console.error('[Auth Callback Route] Unexpected error during code exchange:', e.message);
       const loginUrl = new URL('/login', origin);
       loginUrl.searchParams.set('error', 'callback-exception');
       loginUrl.searchParams.set('message', e.message || 'Unknown error');
       return NextResponse.redirect(loginUrl);
    }
  } else {
    console.error('[Auth Callback Route] No code found in URL params.');
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', 'no-code');
    return NextResponse.redirect(loginUrl);
  }
} 