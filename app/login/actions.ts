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

  // Explicitly set the session token
  const sessionToken = data.session?.access_token;
  if (sessionToken) {
    const cookieStore = await cookies();
    cookieStore.set("custom-auth-token", sessionToken, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: process.env.NODE_ENV === 'production' ? '.wagsandwanders.com' : undefined,
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    console.log(`[Login] Custom token set: ${sessionToken.substring(0, 50)}...`);
  }

  console.log(`[Login] Login successful for ${email}`);
  redirect("/");
}