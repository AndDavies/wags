// lib/supabase/middleware.ts
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function updateSession(request: NextRequest) {
  const supabase = await createClient();

  // Refresh the auth token by fetching the user
  const { error } = await supabase.auth.getUser();

  if (error) {
    // If there's an error (e.g., invalid token), proceed without redirecting to avoid breaking the app
    console.error('Error refreshing Supabase session:', error.message);
  }

  // Return the response, allowing the request to proceed
  return NextResponse.next();
}