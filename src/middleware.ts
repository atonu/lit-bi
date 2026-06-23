import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith("/signin") || pathname.startsWith("/signup") || pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password") || pathname.startsWith("/set-password");

  // Bypass API endpoints and static file processing
  const isBypassRoute =
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".") || // files like favicon.png
    pathname.startsWith("/static");

  if (isBypassRoute) {
    return NextResponse.next();
  }

  // Check for the existence of the refresh token (or our custom isAuthenticated flag)
  const hasAuth = request.cookies.has("refreshToken") || request.cookies.has("isAuthenticated");

  // Redirect to signin if not authenticated
  if (!hasAuth && !isAuthPage) {
    const loginUrl = new URL("/signin", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard/home if authenticated and attempting to view login/signup
  if (hasAuth && isAuthPage && !pathname.startsWith("/set-password")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, favicon.png, etc.
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|favicon.png).*)",
  ],
};
