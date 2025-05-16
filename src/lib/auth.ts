import { getServerSession, NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import prisma from "./prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

export const authConfig: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          throw new Error("No user found with this email");
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // Skip this callback for credentials auth
      if (account?.provider === "credentials") {
        return true;
      }

      if (!profile?.email) {
        throw new Error("No profile");
      }

      // Find the user by email
      const existingUser = await prisma.user.findUnique({
        where: {
          email: profile.email,
        },
        include: {
          accounts: true,
        },
      });

      // If user exists and has no Google account, allow linking
      if (existingUser) {
        const hasGoogleAccount = existingUser.accounts.some(
          (acc) => acc.provider === "google"
        );
        if (!hasGoogleAccount) {
          // Create a new account link
          await prisma.account.create({
            data: {
              userId: existingUser.id,
              type: (account?.type ?? "oauth") as string,
              provider: (account?.provider ?? "google") as string,
              providerAccountId: (account?.providerAccountId ?? profile.sub) as string,
              access_token: account?.access_token ?? null,
              token_type: account?.token_type ?? null,
              scope: account?.scope ?? null,
              id_token: account?.id_token ?? null,
            },
          });
        }
        return true;
      }

      // If user doesn't exist, create new user
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
          role: "USER",
          subscription: {
            connect: { id: freePlan.id },
          },
          accounts: {
            create: {
              type: (account?.type ?? "oauth") as string,
              provider: (account?.provider ?? "google") as string,
              providerAccountId: (account?.providerAccountId ?? profile.sub) as string,
              access_token: account?.access_token ?? null,
              token_type: account?.token_type ?? null,
              scope: account?.scope ?? null,
              id_token: account?.id_token ?? null,
            },
          },
        },
      });

      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email as string },
          select: {
            id: true,
            role: true,
          },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
        token.access_token = user.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.access_token = token.access_token;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours (adjust as needed)
  },
  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/error",
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
