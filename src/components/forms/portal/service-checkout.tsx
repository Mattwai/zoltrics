"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CustomerPaymentForm } from "./payment-form";

interface ServiceCheckoutProps {
  services?: {
    id: string;
    name: string;
    price: number;
  }[];
  amount?: number;
  stripeId?: string;
  onNext(): void;
  onBack(): void;
  onAmount(amount: number): void;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export const ServiceCheckout = ({
  services,
  amount,
  onNext,
  onBack,
  onAmount,
}: ServiceCheckoutProps) => {
  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Order Summary</h2>
          <div className="space-y-4">
            {services &&
              services.map((service, key) => (
                <div key={key} className="flex justify-between items-center">
                  <p className="text-xl font-semibold">{service.name}</p>
                  <p className="text-2xl font-bold">${service.price}</p>
                </div>
              ))}
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <p className="text-xl font-semibold">Total</p>
              <p className="text-2xl font-bold">${amount}</p>
            </div>
          </div>
        </div>

        <Elements stripe={stripePromise}>
          <CustomerPaymentForm onNext={onNext} />
        </Elements>
      </div>
    </Card>
  );
};
