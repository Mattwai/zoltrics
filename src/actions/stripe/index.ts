"use server";

import { authConfig } from "@/lib/auth";
import { client } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET!, {
  typescript: true,
  apiVersion: "2024-04-10",
});

export const onCreateCustomerPaymentIntentSecret = async (
  amount: number,
  stripeId: string
) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        currency: "usd",
        amount: amount * 100,
        automatic_payment_methods: {
          enabled: true,
        },
      },
      { stripeAccount: stripeId }
    );

    if (paymentIntent) {
      return { secret: paymentIntent.client_secret };
    }
  } catch (error) {
    console.log(error);
  }
};

export const onUpdateSubscription = async (
  plan: "STANDARD" | "PROFESSIONAL" | "BUSINESS"
) => {
  try {
    const session = await getServerSession(authConfig);
    if (!session || !session.user) return;
    const update = await client.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        subscription: {
          update: {
            data: {
              plan,
              credits:
                plan == "PROFESSIONAL" ? 100 : plan == "BUSINESS" ? 1000 : 10,
            },
          },
        },
      },
      select: {
        subscription: {
          select: {
            plan: true,
          },
        },
      },
    });
    if (update) {
      return {
        status: 200,
        message: "subscription updated",
        plan: update.subscription?.plan,
      };
    }
  } catch (error) {
    console.log(error);
  }
};

const setPlanAmount = (item: "STANDARD" | "PROFESSIONAL" | "BUSINESS") => {
  // price charged for billing plan
  if (item == "PROFESSIONAL") {
    return 5900;
  }
  if (item == "BUSINESS") {
    return 12900;
  }
  return 0;
};

export const onGetStripeClientSecret = async (
  item: "STANDARD" | "PROFESSIONAL" | "BUSINESS"
) => {
  try {
    const amount = setPlanAmount(item);
    const paymentIntent = await stripe.paymentIntents.create({
      currency: "usd",
      amount: amount,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    if (paymentIntent) {
      return { secret: paymentIntent.client_secret };
    }
  } catch (error) {
    console.log(error);
  }
};
