// middleware.ts
import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function middleware(request: NextRequest) {
  const cookieStore = await cookies();
  const customToken = cookieStore.get("custom-auth-token")?.value;

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser(customToken);

  console.log(`[Middleware] Path: ${request.nextUrl.pathname}, User: ${user?.email || 'none'}, Error: ${error?.message || 'none'}, Custom Token: ${customToken ? customToken.substring(0, 50) + '...' : 'none'}`);

  if (request.nextUrl.pathname.startsWith("/profile") && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*"],
};