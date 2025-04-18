import { getServerSession, NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import prisma from "./prisma";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

export const authConfig: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (!profile?.email) {
        throw new Error("No profile");
      }

      // Find the user by email
      const existingUser = await prisma.user.findUnique({
        where: {
          email: profile.email,
        },
      });

      // If the user does not exist, create a new one
      if (!existingUser) {
        const freePlan = await prisma.billings.create({
          data: {
            plan: "STANDARD",
            credits: 10,
          },
        });

        await prisma.user.create({
          data: {
            email: profile.email,
            name: profile.name || profile.email,
            subscription: {
              connect: { id: freePlan.id },
            },
          },
        });
      }

      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email as string },
        });
        if (dbUser) {
          token.id = dbUser.id;
        }
        token.access_token = user.access_token;
      }
      return token;
    },
    async session({ session, token, user }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      session.user.access_token = token.access_token;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours (adjust as needed)
  },
  pages: {
    signIn: "/auth/sign-in",
  },
};

export async function useLoginIsRequiredServer() {
  const session = await getServerSession(authConfig);
  if (!session) return redirect("/auth/sign-in");
}

export function useLoginIsRequiredClient() {
  const { data: session } = useSession();
  if (!session) {
    if (typeof window !== "undefined") {
      redirect("/auth/sign-in");
    }
  }
}
