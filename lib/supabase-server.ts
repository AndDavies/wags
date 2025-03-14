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
          console.log(`[Supabase Server] Getting cookie ${name}: ${cookie || 'undefined'}`);
          return cookie;
        },
        set(name: string, value: string, options: CookieOptions) {
          console.log(`[Supabase Server] Setting cookie ${name}: ${value}`, { ...options, secure: true, sameSite: 'lax', domain: process.env.NODE_ENV === 'production' ? '.wagsandwanders.com' : undefined });
          try {
            cookieStore.set({
              name,
              value,
              ...options,
              secure: true, // Always true for HTTPS on Vercel
              sameSite: 'lax', // Default for most cases
              domain: process.env.NODE_ENV === 'production' ? '.wagsandwanders.com' : undefined, // Share across subdomains on Vercel
            });
          } catch (error) {
            console.error(`[Supabase Server] Error setting cookie ${name}:`, error);
          }
        },
        remove(name: string, options: CookieOptions) {
          console.log(`[Supabase Server] Removing cookie ${name}`);
          try {
            cookieStore.set({
              name,
              value: '',
              ...options,
              secure: true,
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