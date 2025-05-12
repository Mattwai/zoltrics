import { redirect } from "next/navigation";
import { Stripe } from "stripe";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PageProps {
  searchParams: {
    session_id?: string;
  };
}

async function getStripeSession(sessionId: string) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-04-10",
  });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error) {
    console.error("Error retrieving Stripe session:", error);
    return null;
  }
}

export default async function SuccessPage({ searchParams }: PageProps) {
  const sessionId = searchParams.session_id;

  if (!sessionId) {
    redirect("/");
  }

  const session = await getStripeSession(sessionId);

  if (!session) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <h1 className="mb-8 text-4xl font-bold">Payment Successful!</h1>
        <p className="mb-4 text-lg text-gray-600">
          Thank you for your payment. Your services have been confirmed.
        </p>
        <p className="mb-8 text-sm text-gray-500">
          A confirmation email has been sent to {session.customer_details?.email}
        </p>
        <div className="space-x-4">
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
          <Link href="/services">
            <Button variant="outline">View Services</Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 