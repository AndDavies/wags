// lib/supabase-server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = cookieStore.get(name)?.value;
          console.log(`[Supabase Server] Get cookie ${name}: ${cookie ? `${cookie.substring(0, 50)}... (length: ${cookie.length})` : 'undefined'}`);
          return cookie;
        },
        set(name: string, value: string, options: CookieOptions) {
          console.log(`[Supabase Server] Set cookie ${name}: ${value.substring(0, 50)}... (length: ${value.length})`, options);
          try {
            cookieStore.set({
              name,
              value,
              path: '/',
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              domain: process.env.NODE_ENV === 'production' ? '.wagsandwanders.com' : undefined,
              maxAge: 60 * 60 * 24 * 7,
            });
            console.log(`[Supabase Server] Cookie ${name} set successfully`);
          } catch (error) {
            console.error(`[Supabase Server] Error setting cookie ${name}:`, error);
          }
        },
        remove(name: string, options: CookieOptions) {
          console.log(`[Supabase Server] Remove cookie ${name}`);
          try {
            cookieStore.set({
              name,
              value: '',
              path: '/',
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              domain: process.env.NODE_ENV === 'production' ? '.wagsandwanders.com' : undefined,
            });
          } catch (error) {
            console.error(`[Supabase Server] Error removing cookie ${name}:`, error);
          }
        },
      },
    }
  );
}