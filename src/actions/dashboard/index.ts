"use server";

import { authConfig } from "@/lib/auth";
import { client } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET!, {
  typescript: true,
  apiVersion: "2024-04-10",
});

export const getUserClients = async () => {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) return;
  try {
    const clients = await client.customer.count({
      where: {
        domain: {
          user: {
            id: session.user.id,
          },
        },
      },
    });
    return clients;
  } catch (error) {
    console.log(error);
  }
};

export const getUserBalance = async () => {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) return;

  try {
    const connectedStripe = await client.user.findUnique({
      where: {
        id: session.user.id,
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
  } catch (error) {
    console.error("Error fetching user balance:", error);
    return null; // or handle error as needed
  }
};

export const getUserPlanInfo = async () => {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) return;

  try {
    const plan = await client.user.findUnique({
      where: {
        id: session.user.id,
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
          },
        },
      },
    });
    if (plan) {
      return {
        plan: plan.subscription?.plan,
        domains: plan._count.domains,
      };
    }
  } catch (error) {
    console.error("Error fetching user plan info:", error);
    return null;
  }
};

export const getUserActiveServicesCount = async () => {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) return;

  try {
    const services = await client.service.findMany({
      where: {
        user: {
          id: session.user.id,
        },
      },
      include: {
        status: true
      }
    });

    // Count active services where status.isLive is true
    const activeServicesCount = services.filter(service => service.status?.isLive === true).length;

    return activeServicesCount;
  } catch (error) {
    console.error("Error fetching active services count:", error);
    return 0;
  }
};

export const getUserTransactions = async () => {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) return;

  try {
    const connectedStripe = await client.user.findUnique({
      where: {
        id: session.user.id,
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
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    return null; // or handle error as needed
  }
};
