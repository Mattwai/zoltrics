"use client";

import { useStripeElements } from "@/hooks/billing/use-billing";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Loader } from "../loader";
import { PaymentForm } from "./payment-form";

type StripeElementsProps = {
  payment: "STANDARD" | "PROFESSIONAL" | "BUSINESS";
};

export const StripeElements = ({ payment }: StripeElementsProps) => {
  const StripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISH_KEY!);
  const { stripeSecret, loadForm } = useStripeElements(payment);
  return (
    stripeSecret &&
    StripePromise && (
      <Loader loading={loadForm}>
        <Elements
          stripe={StripePromise}
          options={{
            clientSecret: stripeSecret,
          }}
        >
          <PaymentForm plan={payment} />
        </Elements>
      </Loader>
    )
  );
};
