import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";
import { toast } from "sonner";

interface CustomerPaymentFormProps {
  services: {
    name: string;
    price: number;
    isLive: boolean;
  }[];
  amount: number;
  customerId: string;
  domainId: string;
  stripeId: string;
}

const CustomerPaymentForm = ({
  services,
  amount,
  customerId,
  domainId,
  stripeId,
}: CustomerPaymentFormProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!);
      if (!stripe) {
        toast.error("Payment provider not available");
        return;
      }

      // Create payment session
      const response = await fetch("/api/create-payment-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          services,
          amount,
          customerId,
          domainId,
          stripeId,
        }),
      });

      const session = await response.json();

      if (!session || !session.id) {
        toast.error("Failed to create payment session");
        return;
      }

      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (result.error) {
        toast.error(result.error.message);
      }
    } catch (error) {
      toast.error("Payment failed. Please try again.");
      console.error("Payment error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Payment Details</h2>
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Selected Services</h3>
        <div className="space-y-4">
          {services.map((service) => (
            <div key={service.name} className="flex justify-between items-center">
              <span>{service.name}</span>
              <span>${service.price}</span>
            </div>
          ))}
          <div className="border-t pt-4 font-bold">
            <div className="flex justify-between items-center">
              <span>Total</span>
              <span>${amount}</span>
            </div>
          </div>
        </div>
      </div>
      <Button 
        onClick={handleSubmit} 
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "Processing..." : "Proceed to Payment"}
      </Button>
    </div>
  );
};

export default CustomerPaymentForm; 