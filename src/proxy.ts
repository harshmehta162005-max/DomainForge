import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Next.js 16 "proxy" middleware — runs on every matched request.
 * In Next.js 16+, this file MUST be named proxy.ts (not middleware.ts).
 *
 * Refreshes Supabase session cookies so the user stays logged in
 * across navigation and page refreshes.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write cookies back to both the request and response so the
          // session token is refreshed on every request.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Calling getUser() is what refreshes and persists the session.
  // Do NOT use getSession() — it doesn't re-validate the JWT with Supabase servers.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect all /dashboard/* routes — redirect unauthenticated users to home
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    url.searchParams.set("auth", "required")
    return NextResponse.redirect(url)
  }

  // Return response with refreshed session cookies
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static assets)
     * - _next/image   (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - /icons/*      (public icon assets)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|icons/).*)",
  ],
}
