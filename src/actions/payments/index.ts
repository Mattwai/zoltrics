"use server";

import { client } from "@/lib/prisma";

export const onGetDomainProductsAndConnectedAccountId = async (id: string) => {
  try {
    const connectedAccount = await client.domain.findUnique({
      where: {
        id,
      },
      select: {
        User: {
          select: {
            stripeId: true,
          },
        },
      },
    });

    const products = await client.product.findMany({
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

    if (products) {
      const totalAmount = products.reduce(
        (current: number, next: { pricing: { price: number } | null, status: { isLive: boolean } | null }) => {
          return current + (next.pricing?.price || 0);
        },
        0
      );
      return {
        products: products.map(p => ({
          name: p.name,
          price: p.pricing?.price || 0,
          isLive: p.status?.isLive || false
        })),
        amount: totalAmount,
        stripeId: connectedAccount?.User?.stripeId ?? null,
      };
    } else {
      return {
        products: [],
        amount: 0,
        stripeId: connectedAccount?.User?.stripeId ?? null,
      };
    }
  } catch (error) {
    console.log(error);
    return {
      products: [],
      amount: 0,
      stripeId: null,
    };
  }
};
