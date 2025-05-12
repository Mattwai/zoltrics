// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // Skip middleware for auth routes
  if (request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });
  
  // Check if the user is authenticated
  if (!token) {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url));
  }

  // Get user role from token
  const userRole = token.role as string;

  // Check if the user is trying to access admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Only allow access if user has admin role
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // For non-admin routes, allow access to any authenticated user
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/email-marketing/:path*",
    "/appointment/:path*",
    "/integration/:path*",
    "/conversation/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/api/invitations/:path*",
  ],
};
