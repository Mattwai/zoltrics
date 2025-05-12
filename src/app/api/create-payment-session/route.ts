import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { services, amount, customerId, domainId, stripeId } = body;

    if (!services || !amount || !customerId || !stripeId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create line items for each service
    const lineItems = services.map((service: any) => ({
      price_data: {
        currency: "nzd",
        product_data: {
          name: service.name,
        },
        unit_amount: service.price * 100, // Convert to cents
      },
      quantity: 1,
    }));

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer: stripeId,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
      metadata: {
        customerId,
        domainId,
      },
    });

    return NextResponse.json({ id: session.id });
  } catch (error) {
    console.error("Error creating payment session:", error);
    return NextResponse.json(
      { error: "Failed to create payment session" },
      { status: 500 }
    );
  }
} 