// src/app/api/stripe/connect/route.ts
import { client } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET!, {
  typescript: true,
  apiVersion: "2024-06-20",
});

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return new NextResponse("User not authenticated");
    const account = await stripe.accounts.create({
      type: "express",
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.BASE_URL}/api/stripe/connect`,
      return_url: `${process.env.BASE_URL}/integration`,
      type: "account_onboarding",
    });

    // Save the account ID to your database for future reference
    await client.user.update({
      where: { clerkId: user.id },
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
