// app/login/actions.ts
"use server";

import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { getURL } from "@/lib/utils";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectPath = formData.get("redirectPath") as string | null;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error(`[Login] Error: ${error.message}`);
    throw new Error(error.message);
  }

  // @supabase/ssr handles cookie setting for sessions automatically now
  // const sessionToken = data.session?.access_token;
  // if (sessionToken) {
  //   const cookieStore = await cookies();
  //   cookieStore.set("auth-token", sessionToken, { ... });
  //   console.log(`[Login] Auth token set.`);
  // }

  console.log(`[Login] Login successful for ${email}. Redirecting to: ${redirectPath || "/"}`);
  redirect(redirectPath || "/");
}

export async function loginWithGoogle(redirectPath?: string | null) {
  const supabase = await createClient();

  // Get the base callback URL
  const callbackUrlBase = process.env.NODE_ENV === 'production'
    ? `${getURL()}auth/callback` 
    : 'http://localhost:3000/auth/callback';

  // Append the final desired path as the 'next' query parameter
  let finalRedirectToUrl = callbackUrlBase;
  if (redirectPath) {
    const path = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`;
    finalRedirectToUrl = `${callbackUrlBase}?next=${encodeURIComponent(path)}`;
    console.log(`[Google Login] Appending final path. Full redirectTo for Supabase: ${finalRedirectToUrl}`);
  } else {
     console.log(`[Google Login] No final path provided. Using base callback URL for Supabase: ${callbackUrlBase}`);
  }

  // Call signInWithOAuth with the callback URL + next parameter
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: finalRedirectToUrl, 
      // Remove options.data - passing path via query param now
    }
  });

  if (error) {
    console.error(`[Google Login] Error initiating OAuth: ${error.message}`);
    throw new Error(error.message);
  }

  if (data.url) {
    // This URL sent to Google should have redirect_to= pointing to callbackUrlBase (without the ?next=)
    // Supabase handles remembering the 'next' parameter internally for the callback step.
    console.log(`[Google Login] Redirecting user to Google auth page: ${data.url}`);
    redirect(data.url); 
  } else {
    console.error('[Google Login] No redirect URL provided by Supabase');
    throw new Error("Could not initiate Google login");
  }
}