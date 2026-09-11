import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { hasEnvVars } from "../utils";

/**
 * Routes that can be visited without signing in. Everything else redirects
 * to the sign-in page. Pages themselves still verify the user server-side
 * where it matters; this proxy is a convenience, not the security boundary.
 */
function isPublicPath(pathname: string): boolean {
  return pathname === "/" || pathname.startsWith("/auth");
}

/**
 * Runs on every request (see proxy.ts at the project root). It refreshes the
 * Supabase session cookie so server components always see a valid session,
 * and redirects signed-out visitors away from protected pages.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // In an environment without Supabase configured, serve pages without
  // touching auth rather than failing every request.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // Always create a fresh client per request; sharing one across requests
  // would leak cookies between users.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: Do not run code between createServerClient and getClaims().
  // getClaims() is what refreshes the session; skipping it can randomly sign
  // users out when server components later read the session.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: Return supabaseResponse as-is. Creating a new response without
  // copying its cookies would desync the browser and server sessions.
  return supabaseResponse;
}
