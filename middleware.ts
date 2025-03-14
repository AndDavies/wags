// middleware.ts
import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  console.log(`[Middleware] Path: ${request.nextUrl.pathname}, User: ${user?.email || 'none'}, Error: ${error?.message || 'none'}`);

  if (request.nextUrl.pathname.startsWith("/profile") && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*"],
};