// app/login/actions.ts
"use server";

import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

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

  const sessionToken = data.session?.access_token;
  if (sessionToken) {
    const cookieStore = await cookies();
    cookieStore.set("auth-token", sessionToken, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: process.env.NODE_ENV === 'production' ? '.wagsandwanders.com' : undefined,
      maxAge: 60 * 60 * 24 * 7,
    });
    console.log(`[Login] Auth token set.`);
  }

  console.log(`[Login] Login successful for ${email}. Redirecting to: ${redirectPath || "/"}`);
  redirect(redirectPath || "/");
}

export async function loginWithGoogle(redirectPath?: string | null) {
  const supabase = await createClient();
  const callbackUrl = process.env.NODE_ENV === 'production'
    ? "https://wagsandwanders.com/auth/callback"
    : "http://localhost:3000/auth/callback";

  const options: { redirectTo: string; state?: string } = {
    redirectTo: callbackUrl,
  };

  if (redirectPath) {
    options.state = Buffer.from(JSON.stringify({ redirectPath })).toString('base64');
    console.log(`[Google Login] Setting state with redirectPath: ${redirectPath}`);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: options,
  });

  if (error) {
    console.error(`[Google Login] Error: ${error.message}`);
    throw new Error(error.message);
  }

  if (data.url) {
    console.log(`[Google Login] Redirecting to Google: ${data.url}`);
    redirect(data.url);
  } else {
    console.error('[Google Login] No redirect URL provided by Supabase');
    throw new Error("Could not initiate Google login");
  }
}