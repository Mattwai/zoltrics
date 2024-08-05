"use server";

import { client } from "@/lib/prisma";

export const onGetDomainProductsAndConnectedAccountId = async (id: string) => {
  try {
    const connectedAccount = await client.domain.findUnique({
      where: { id },
      select: {
        User: {
          select: {
            stripeId: true,
          },
        },
      },
    });

    const products = await client.product.findMany({
      where: { domainId: id },
      select: {
        price: true,
        name: true,
      },
    });

    const totalAmount = products.reduce(
      (current: number, next: { price: number }) => {
        return current + next.price;
      },
      0
    );

    return {
      products,
      amount: totalAmount,
      stripeId: connectedAccount?.User?.stripeId ?? null,
    };
  } catch (error) {
    console.error(
      "Error fetching domain products and connected account ID:",
      error
    );
    return {
      products: [],
      amount: 0,
      stripeId: null,
    };
  }
};
