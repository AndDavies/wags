// app/signout/route.ts
import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error(`[Signout] Error: ${error.message}`);
  } else {
    console.log(`[Signout] Signout successful`);
  }

  const response = NextResponse.redirect(new URL("/", "https://wagsandwanders.com"));
  response.cookies.delete("sb-auqyngiwrzjwylzylxtb-auth-token");
  return response;
}