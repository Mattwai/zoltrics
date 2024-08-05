"use server";

import { client } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET!, {
  typescript: true,
  apiVersion: "2024-06-20",
});

export const getUserClients = async () => {
  try {
    const user = await currentUser();
    if (user) {
      const clients = await client.customer.count({
        where: {
          Domain: {
            User: {
              clerkId: user.id,
            },
          },
        },
      });

      return clients;
    }
  } catch (error) {
    console.log(error);
  }
};

export const getUserBalance = async () => {
  try {
    const user = await currentUser();
    if (user) {
      const connectedStripe = await client.user.findUnique({
        where: {
          clerkId: user.id,
        },
        select: {
          stripeId: true,
        },
      });
      if (!connectedStripe || !connectedStripe.stripeId) {
        console.warn("No Stripe ID found for user.");
        return null;
      }
      const transactions = await stripe.balance.retrieve({
        stripeAccount: connectedStripe.stripeId!,
      });
      const sales = transactions.pending.reduce((total, next) => {
        return total + next.amount;
      }, 0);

      return sales / 100;
    }
  } catch (error) {
    console.error("Error fetching user balance:", error);
    return null; // or handle error as needed
  }
};

export const getUserPlanInfo = async () => {
  try {
    const user = await currentUser();
    if (user) {
      const plan = await client.user.findUnique({
        where: {
          clerkId: user.id,
        },
        select: {
          _count: {
            select: {
              domains: true,
            },
          },
          subscription: {
            select: {
              plan: true,
              credits: true,
            },
          },
        },
      });
      if (plan) {
        return {
          plan: plan.subscription?.plan,
          credits: plan.subscription?.credits,
          domains: plan._count.domains,
        };
      }
    }
  } catch (error) {
    console.error("Error fetching user plan info:", error);
    return null; // or handle error as needed
  }
};

export const getUserTotalProductPrices = async () => {
  try {
    const user = await currentUser();
    if (user) {
      const products = await client.product.findMany({
        where: {
          Domain: {
            User: {
              clerkId: user.id,
            },
          },
        },
        select: {
          price: true,
        },
      });

      const total = products.reduce(
        (total: number, next: { price: number }) => {
          return total + next.price;
        },
        0
      );

      return total;
    }
  } catch (error) {
    console.error("Error fetching total product prices:", error);
    return null; // or handle error as needed
  }
};

export const getUserTransactions = async () => {
  try {
    const user = await currentUser();
    if (user) {
      const connectedStripe = await client.user.findUnique({
        where: {
          clerkId: user.id,
        },
        select: {
          stripeId: true,
        },
      });
      if (!connectedStripe || !connectedStripe.stripeId) {
        console.warn("No Stripe ID found for user.");
        return null;
      }
      const transactions = await stripe.charges.list({
        stripeAccount: connectedStripe.stripeId!,
      });
      if (transactions) {
        return transactions;
      }
    }
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    return null; // or handle error as needed
  }
};
