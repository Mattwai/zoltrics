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
        price: true,
        name: true,
      },
    });

    if (products) {
      const totalAmount = products.reduce(
        (current: number, next: { price: number }) => {
          return current + next.price;
        },
        0
      );
      return {
        products: products,
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
