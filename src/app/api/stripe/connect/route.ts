// src/app/api/stripe/connect/route.ts

import { authConfig } from "@/lib/auth";
import { client } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import Stripe from "stripe";


export const dynamic = 'force-dynamic';
const stripe = new Stripe(process.env.STRIPE_SECRET!, {
  typescript: true,
  apiVersion: "2024-04-10",
});

export async function GET() {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "User not authenticated" },
      { status: 401 }
    );
  }
  try {
    const account = await stripe.accounts.create({
      type: "express",
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/stripe/connect`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/integration`,
      type: "account_onboarding",
    });

    // Save the account ID to your database for future reference
    await client.user.update({
      where: { id: session.user.id },
      data: { stripeId: account.id },
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error("An error occurred when calling the Stripe API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
