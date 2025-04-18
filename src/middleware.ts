// middleware.ts
import { withAuth } from "next-auth/middleware";

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
