import { authConfig } from "@/lib/auth";
import { client } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET!, {
  typescript: true,
  apiVersion: "2024-04-10",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, userId } = body;

    if (!bookingId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the booking and user details
    const booking = await client.bookings.findUnique({
      where: { id: bookingId },
      include: {
        Customer: {
          include: {
            Domain: {
              include: {
                User: {
                  select: {
                    stripeId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const stripeId = booking.Customer?.Domain?.User?.stripeId;
    if (!stripeId) {
      return NextResponse.json(
        { error: "Stripe account not connected" },
        { status: 400 }
      );
    }

    // Create a payment intent for the deposit (using $20 as an example deposit amount)
    const paymentIntent = await stripe.paymentIntents.create(
      {
        currency: "nzd",
        amount: 2000, // $20.00
        automatic_payment_methods: {
          enabled: true,
        },
      },
      { stripeAccount: stripeId }
    );

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      bookingId: booking.id
    });
  } catch (error) {
    console.error("Error creating deposit payment:", error);
    return NextResponse.json(
      { error: "Failed to create deposit payment" },
      { status: 500 }
    );
  }
} 