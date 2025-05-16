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
    const booking = await client.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        },
        service: {
          select: {
            name: true,
            pricing: {
              select: {
                price: true
              }
            },
            domain: {
              select: {
                user: {
                  select: {
                    stripeId: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!booking) {
      return new NextResponse(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404 }
      );
    }

    const customerName = booking.customer?.name || "Customer";
    const customerEmail = booking.customer?.email || "";
    const serviceName = booking.service?.name || "Service";
    const servicePrice = booking.service?.pricing?.price || 0;
    const stripeId = booking.service?.domain?.user?.stripeId;

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