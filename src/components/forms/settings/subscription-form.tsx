"use client";
import { Loader } from "@/components/loader";
import { StripeElements } from "@/components/subscription/stripe-elements";
import SubscriptionCard from "@/components/subscription/subscription-card";
import { Button } from "@/components/ui/button";
import { useSubscriptions } from "@/hooks/billing/use-billing";
import { pricingCards } from "@/constants/pricing-cards";

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
          {pricingCards.map((card) => (
            <SubscriptionCard
              key={card.title}
              title={card.title}
              description={card.description}
              price={card.price.replace("$", "")}
              payment={payment}
              onPayment={onSetPayment}
              id={card.title.toUpperCase()}
            />
          ))}
        </div>
        {payment !== "STANDARD" && <StripeElements payment={payment} />}
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
