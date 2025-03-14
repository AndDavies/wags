// app/login/actions.ts
"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error(`[Login] Error: ${error.message}`);
    throw new Error(error.message);
  }

  console.log(`[Login] Login successful for ${email}`);
  revalidatePath("/"); // Force revalidation of the root page
  return { redirect: "/" }; // Return redirect object for client-side handling
}