import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith("/login");
  const isMarketing =
    pathname === "/" ||
    pathname === "/demo" ||
    pathname.startsWith("/badge-printing") ||
    pathname === "/nl" ||
    pathname.startsWith("/nl/");
  // Crawler-facing endpoints must stay publicly reachable, otherwise Google
  // sees a redirect to /login instead of the sitemap / robots manifest.
  const isCrawlerFile =
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/opengraph-image" ||
    pathname === "/twitter-image" ||
    pathname === "/icon.svg";
  const isPublic =
    isAuthPage || isMarketing || isCrawlerFile || pathname.startsWith("/auth");

  // Public pages that aren't /login never need to know who the user is —
  // skip the Supabase auth round trip entirely. This shaves ~100-200ms
  // off every marketing/crawler request. Protected pages and /login (which
  // redirects signed-in users to the app) still verify the session.
  if (isPublic && !isAuthPage) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // On /login, only bother asking Supabase when there's a session cookie to
  // validate — anonymous visitors (the common case) skip the round trip.
  const hasSessionCookie = request.cookies
    .getAll()
    .some((c) => c.name.includes("-auth-token"));
  if (isAuthPage && !hasSessionCookie) {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/events";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
