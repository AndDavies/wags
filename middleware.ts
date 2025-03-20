// middleware.ts
import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function middleware(request: NextRequest) {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth-token")?.value;

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser(authToken);

  console.log(`[Middleware] Path: ${request.nextUrl.pathname}, User: ${user?.email || 'none'}, Error: ${error?.message || 'none'}, Auth Token: ${authToken ? authToken.substring(0, 50) + '...' : 'none'}`);

  const protectedRoutes = ["/profile", "/create-trip"];
  if (protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route)) && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/create-trip/:path*"],
};