// app/signup/actions.ts
"use server";

import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectPath = formData.get("redirectPath") as string | null; // Read redirect path

  // TODO: Add server-side validation for email/password/name if needed

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Make sure your users table / trigger handles profile creation if needed
      data: { full_name: formData.get("name") as string || "" },
      // emailRedirectTo: If you require email confirmation, set this carefully
    },
  });

  if (error) {
    console.error(`[Signup] Error: ${error.message}`);
    // Consider redirecting back with error query param instead of throwing?
    // redirect(`/signup?error=${encodeURIComponent(error.message)}&redirectPath=${encodeURIComponent(redirectPath || '')}`);
    throw new Error(error.message);
  }

  // Note: Supabase signUp doesn't automatically sign the user in or return a session.
  // The user typically needs to confirm email (if enabled) and then log in separately.
  // If email confirmation is OFF, you might call signInWithPassword here, 
  // but the standard flow redirects to a 'check your email' page or login.
  
  // For now, redirect based on path, assuming login happens next.
  // If email confirmation is required, redirecting to the specified path might 
  // happen *after* confirmation via the email link.
  console.log(`[Signup] Signup successful for ${email}. Redirecting to: ${redirectPath || "/"}`);
  redirect(redirectPath || "/"); // Use redirectPath or default
}