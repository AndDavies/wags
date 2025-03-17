// app/login/actions.ts
"use server";

import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

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
    console.log(`[Login] Auth token set: ${sessionToken.substring(0, 50)}...`);
  }

  console.log(`[Login] Login successful for ${email}`);
  redirect("/");
}

export async function loginWithGoogle() {
  const supabase = await createClient();
  const redirectTo = process.env.NODE_ENV === 'production'
    ? "https://wagsandwanders.com/auth/callback"
    : "http://localhost:3000/auth/callback";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo, // Ensure this matches your live callback
    },
  });

  if (error) {
    console.error(`[Google Login] Error: ${error.message}`);
    throw new Error(error.message);
  }

  if (data.url) {
    console.log(`[Google Login] Redirecting to: ${data.url}`);
    redirect(data.url); // Redirect to Google OAuth page
  } else {
    throw new Error("No redirect URL provided by Supabase");
  }
}