// app/signup/actions.ts
"use server";

import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: formData.get("name") as string || "" },
    },
  });
  if (error) {
    throw new Error(error.message);
  }

  redirect("/"); // Redirect after successful signup
}