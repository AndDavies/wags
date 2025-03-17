"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client"; // Import createClient instead

export default function AuthCallback() {
  const router = useRouter();
  const supabase = createClient(); // Initialize Supabase client

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error(`[Auth Callback] Error: ${error.message}`);
        router.push("/login");
        return;
      }

      const sessionToken = data.session?.access_token;
      if (sessionToken) {
        // Set cookie client-side
        document.cookie = `auth-token=${sessionToken}; path=/; max-age=${60 * 60 * 24 * 7}; ${
          process.env.NODE_ENV === "production" ? "secure; samesite=lax; domain=.wagsandwanders.com" : ""
        }`;
        router.push("/"); // Redirect to home or dashboard
      } else {
        router.push("/login");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Loading...</p>
    </div>
  );
}