"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const handleCallback = async () => {
      const stateParam = searchParams.get('state');
      let redirectPath = "/";

      if (stateParam) {
        try {
          const decodedState = Buffer.from(stateParam, 'base64').toString('utf-8');
          const stateData = JSON.parse(decodedState);
          if (stateData && typeof stateData.redirectPath === 'string') {
            redirectPath = stateData.redirectPath;
            console.log(`[Auth Callback] Redirect path from state: ${redirectPath}`);
          } else {
            console.warn('[Auth Callback] Invalid state data format.');
          }
        } catch (e) {
          console.error('[Auth Callback] Error decoding/parsing state:', e);
        }
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error(`[Auth Callback] Error getting session: ${error.message}`);
        router.push("/login?error=callback-error");
        return;
      }

      const sessionToken = data.session?.access_token;
      if (sessionToken) {
        console.log('[Auth Callback] Session found, setting cookie.');
        document.cookie = `auth-token=${sessionToken}; path=/; max-age=${60 * 60 * 24 * 7}; ${
          process.env.NODE_ENV === "production" ? "secure; samesite=lax; domain=.wagsandwanders.com" : ""
        }`;
        console.log(`[Auth Callback] Redirecting to: ${redirectPath}`);
        router.push(redirectPath);
      } else {
        console.warn('[Auth Callback] No session found after callback.');
        router.push("/login?error=no-session");
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Processing login...</p>
    </div>
  );
}