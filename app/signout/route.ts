// app/signout/route.ts
import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const response = NextResponse.redirect(new URL("/", "https://wagsandwanders.com"));
  response.cookies.delete("sb-auqyngiwrzjwylzylxtb-auth-token");
  response.cookies.delete("auth-token");
  return response;
}