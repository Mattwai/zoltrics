"use server";

import { client } from "@/lib/prisma";

export const onGetDomainServicesAndConnectedAccountId = async (id: string) => {
  try {
    const connectedAccount = await client.domain.findUnique({
      where: {
        id,
      },
      select: {
        user: {
          select: {
            stripeId: true,
          },
        },
      },
    });

    const services = await client.service.findMany({
      where: {
        domainId: id,
      },
      select: {
        name: true,
        pricing: {
          select: {
            price: true
          }
        },
        status: {
          select: {
            isLive: true
          }
        }
      },
    });

    if (services) {
      const totalAmount = services.reduce(
        (current: number, next: { pricing: { price: number } | null, status: { isLive: boolean } | null }) => {
          return current + (next.pricing?.price || 0);
        },
        0
      );
      return {
        services: services.map(s => ({
          name: s.name,
          price: s.pricing?.price || 0,
          isLive: s.status?.isLive || false
        })),
        amount: totalAmount,
        stripeId: connectedAccount?.user?.stripeId ?? null,
      };
    } else {
      return {
        services: [],
        amount: 0,
        stripeId: connectedAccount?.user?.stripeId ?? null,
      };
    }
  } catch (error) {
    console.log(error);
    return {
      services: [],
      amount: 0,
      stripeId: null,
    };
  }
};
