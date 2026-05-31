import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth(function proxy(req: NextRequest & { auth: unknown }) {
  const { nextUrl } = req;
  const isLoggedIn = !!(req as { auth?: { user?: unknown } }).auth?.user;

  const isAuthPage =
    nextUrl.pathname === "/login" || nextUrl.pathname === "/signup";

  const isPublic = nextUrl.pathname.startsWith("/share/");

  const isProtected =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/notes");

  if (isPublic) return NextResponse.next();

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
