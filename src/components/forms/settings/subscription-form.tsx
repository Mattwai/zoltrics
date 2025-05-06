"use client";
import { Loader } from "@/components/loader";
import { StripeElements } from "@/components/subscription/stripe-elements";
import SubscriptionCard from "@/components/subscription/subscription-card";
import { Button } from "@/components/ui/button";
import { useSubscriptions } from "@/hooks/billing/use-billing";

type Props = {
  plan: "STANDARD" | "PROFESSIONAL" | "BUSINESS";
};

const SubscriptionForm = ({ plan }: Props) => {
  const { loading, onSetPayment, payment, onUpdatetToFreTier } =
    useSubscriptions(plan);

  return (
    <Loader loading={loading}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <SubscriptionCard
            title="STANDARD"
            description="Perfect if you're just getting started with Zoltrics"
            price="0"
            payment={payment}
            onPayment={onSetPayment}
            id="STANDARD"
          />

          <SubscriptionCard
            title="PRO"
            description="Perfect if you're just getting started with Zoltrics"
            price="15"
            payment={payment}
            onPayment={onSetPayment}
            id="PRO"
          />

          <SubscriptionCard
            title="BUSINESS"
            description="Perfect if you're just getting started with Zoltrics"
            price="35"
            payment={payment}
            onPayment={onSetPayment}
            id="BUSINESS"
          />
        </div>
        <StripeElements payment={payment} />
        {payment === "STANDARD" && (
          <Button onClick={onUpdatetToFreTier}>
            <Loader loading={loading}>Confirm</Loader>
          </Button>
        )}
      </div>
    </Loader>
  );
};

export default SubscriptionForm;
