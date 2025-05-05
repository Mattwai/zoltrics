"use client";

import { Loader } from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

type DepositPaymentFormProps = {
  clientSecret: string;
  bookingId: string;
  onSuccess: () => void;
};

const DepositPaymentForm = ({ clientSecret, bookingId, onSuccess }: DepositPaymentFormProps) => {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    try {
      setProcessing(true);

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Payment failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent?.status === "succeeded") {
        // Update booking to mark deposit as paid
        const response = await fetch(`/api/bookings/${bookingId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            depositPaid: true,
          }),
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "Deposit payment completed successfully",
          });
          onSuccess();
        } else {
          throw new Error("Failed to update booking");
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Error",
        description: "An error occurred during payment",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" className="w-full" disabled={!stripe || processing}>
        <Loader loading={processing}>Pay Deposit</Loader>
      </Button>
    </form>
  );
};

export const DepositPayment = ({ clientSecret, bookingId, onSuccess }: DepositPaymentFormProps) => {
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISH_KEY!);

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <DepositPaymentForm 
        clientSecret={clientSecret} 
        bookingId={bookingId} 
        onSuccess={onSuccess} 
      />
    </Elements>
  );
}; 