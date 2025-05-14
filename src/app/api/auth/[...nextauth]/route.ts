import { authConfig } from "@/lib/auth";
import NextAuth from "next-auth/next";

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };

// Add export to mark this route as dynamic
export const dynamic = 'force-dynamic';
