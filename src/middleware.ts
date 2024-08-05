// middleware.ts

export default withAuth({
  pages: {
    signIn: "/auth/sign-in",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/email-marketing/:path*",
    "/appointment/:path*",
    "/integration/:path*",
    "/conversation/:path*",
    "/settings/:path*",
  ],
};
