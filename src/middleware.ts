import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || "bi-lite-jwt-secret-key-super-secure-12345678",
  });

  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/signin") || pathname.startsWith("/signup");

  // Bypass API auth endpoints and static file processing
  const isBypassRoute =
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".") || // files like favicon.png
    pathname.startsWith("/static");

  if (isBypassRoute) {
    return NextResponse.next();
  }

  // Redirect to signin if not authenticated
  if (!token && !isAuthPage) {
    const loginUrl = new URL("/signin", request.url);
    // Optionally capture redirect callback
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard/home if authenticated and attempting to view login/signup
  if (token && isAuthPage) {
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
