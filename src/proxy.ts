import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase session middleware (Next.js 16 `proxy.ts`).
 * - Refreshes the auth token on every request so Server Components can read the session.
 * - Redirects unauthenticated users to /signin (except public routes).
 * - Redirects already-authenticated users away from /signin.
 * - Locks `referrer`-type users to /projects (their landing page) + feedback.
 */

// Paths a referrer is allowed to reach. Anything else → /projects.
// /profile is allowed so the user popover (Sign Out / Profile) keeps working.
const REFERRER_ALLOW_PREFIXES = [
  "/projects",
  "/feedback",
  "/profile",
  "/signin",
  "/reset_pw",
  "/auth",
  "/api",
];

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — do NOT remove this getUser() call.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public routes that don't require auth.
  // `/m/...` are the public marketing-validation landing pages (mkt_landing);
  // they must render for anonymous prospects, so they are exempt from the gate.
  const isPublicRoute =
    pathname === "/signin" ||
    pathname === "/reset_pw" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname === "/m" ||
    pathname.startsWith("/m/") ||
    pathname === "/favicon.ico";

  // Already logged in → redirect away from signin only.
  // /reset_pw must always be accessible — Supabase exchanges the recovery token
  // client-side from the URL hash, so the server initially sees no session.
  if (user && pathname === "/signin") {
    return NextResponse.redirect(new URL("/projects", request.url));
  }

  // Not logged in → redirect to signin
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // Referrer users are clamped to their own dashboard.
  // The `profiles` query only exists to answer "is this user a referrer",
  // and that answer only ever matters when the path is OUTSIDE the
  // referrer allow-list (inside it, the clamp could never redirect either
  // way). Skip the query entirely on allow-listed paths — this is the
  // common case for staff too, since /projects, /profile etc. are shared
  // landing pages.
  const pathIsReferrerAllowed = REFERRER_ALLOW_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (user && !pathIsReferrerAllowed) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("type")
      .eq("id", user.id)
      .single();

    if (profile?.type === "referrer") {
      return NextResponse.redirect(
        new URL("/projects", request.url)
      );
    }
  }

  return supabaseResponse;
}

// Deferred optimization (tracked in .specs/project/ROADMAP.md): move
// `user_type` into a JWT custom claim via a Supabase Auth Hook. That would
// let the referrer clamp read the role straight off the already-verified
// session token, removing this DB query from middleware entirely instead
// of just narrowing when it runs.
export const config = {
  matcher: [
    /*
     * Match all request paths except static files, images, and routes that
     * do their own auth (or need none):
     *  - _next/*  → framework internals, never need a session
     *  - api/*    → route handlers authenticate themselves (bearer/HMAC/
     *               service-role) and don't read the middleware-refreshed
     *               cookie
     *  - m, m/*   → public marketing-validation landing pages, anonymous
     * This is the recommended pattern from the Supabase SSR docs, extended
     * to exclude the routes above.
     */
    "/((?!_next/|api/|m(?:/|$)|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
