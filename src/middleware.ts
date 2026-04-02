import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const TOKEN = "lyra_access_token";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN)?.value;

  if (pathname.startsWith("/admin")) {
    if (!token) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
