"use server";

import { authConfig } from "@/lib/auth";
import { client } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { onGetAllAccountDomains } from "../settings";

export const onCompleteUserRegistration = async (
  name: string,
  id: string,
  email: string
) => {
  try {
    const registered = await client.user.create({
      data: {
        name,
        id,
        email,
        subscription: {
          create: {},
        },
      },
      select: {
        name: true,
        id: true,
      },
    });

    if (registered) {
      return { status: 200, user: registered };
    }
  } catch (error) {
    return { status: 400 };
  }
};

export const onLoginUser = async () => {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) redirect("/auth/sign-in");
  else {
    try {
      const authenticated = await client.user.findUnique({
        where: {
          id: session.user.id,
        },
        select: {
          name: true,
          id: true,
        },
      });
      if (authenticated) {
        const domains = await onGetAllAccountDomains();
        return { status: 200, user: authenticated, domain: domains };
      }
    } catch (error) {
      return { status: 400 };
    }
  }
};
