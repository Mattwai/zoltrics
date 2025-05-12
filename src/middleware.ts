// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Redirect all protected routes to the homepage
  return NextResponse.redirect(new URL('/#contact', request.url));
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/email-marketing/:path*",
    "/appointment/:path*",
    "/integration/:path*",
    "/conversation/:path*",
    "/settings/:path*",
    "/auth/:path*",
  ],
};
