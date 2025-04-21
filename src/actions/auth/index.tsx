"use server";

import { authConfig } from "@/lib/auth";
import { client } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { onGetAllAccountDomains } from "../settings";

const generateBookingLink = async () => {
  let link;
  let exists = true;

  while (exists) {
    link = Math.random().toString(36).substring(2, 15);
    const user = await client.user.findUnique({
      where: { bookingLink: link },
    });
    exists = !!user;
  }

  return link;
};

export const onCompleteUserRegistration = async (
  name: string,
  id: string,
  email: string
) => {
  try {
    const uniqueBookingLink = await generateBookingLink();

    const registered = await client.user.create({
      data: {
        id,
        name,
        email,
        subscription: {
          create: {},
        },
        bookingLink: uniqueBookingLink,
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
