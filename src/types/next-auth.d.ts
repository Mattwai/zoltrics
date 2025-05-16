import "next-auth";
import "next-auth/jwt";
import { User as PrismaUser } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      access_token?: string;
      role?: string;
    };
  }

  interface User extends Partial<PrismaUser> {
    access_token?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    access_token?: string;
    role?: string;
  }
}
