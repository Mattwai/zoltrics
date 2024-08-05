"use client";
import { Loader } from "@/components/loader";
import { StripeElements } from "@/components/settings/stripe-elements";
import SubscriptionCard from "@/components/settings/subscription-card";
import { Button } from "@/components/ui/button";
import { useSubscriptions } from "@/hooks/billing/use-billing";

type Props = {
  plan: "FREE" | "STANDARD" | "PROFESSIONAL";
};

const SubscriptionForm = ({ plan }: Props) => {
  const { loading, onSetPayment, payment, onUpdatetToFreTier } =
    useSubscriptions(plan);

  return (
    <Loader loading={loading}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <SubscriptionCard
            title="FREE"
            description="Get started with our free AI CRM, perfect for individuals and small businesses"
            price="0"
            payment={payment}
            onPayment={onSetPayment}
            id="FREE"
          />

          <SubscriptionCard
            title="STANDARD"
            description="Unlock the tools and support for growing and managing businesses and customers"
            price="59"
            payment={payment}
            onPayment={onSetPayment}
            id="STANDARD"
          />

          <SubscriptionCard
            title="PROFESSIONAL"
            description="Full access to premium features to support maximum performance and scalability"
            price="129"
            payment={payment}
            onPayment={onSetPayment}
            id="PROFESSIONAL"
          />
        </div>
        <StripeElements payment={payment} />
        {payment === "FREE" && (
          <Button onClick={onUpdatetToFreTier}>
            <Loader loading={loading}>Confirm</Loader>
          </Button>
        )}
      </div>
    </Loader>
  );
};

export default SubscriptionForm;
