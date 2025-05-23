import { CheckCircle2Icon } from "lucide-react";
import { StripeConnect } from "../subscription/stripe-connect";
import { Button } from "../ui/button";

type IntegrationModalBodyProps = {
  type: string;
  connections: {
    [key in "stripe"]: boolean;
  };
};

export const IntegrationModalBody = ({
  type,
  connections,
}: IntegrationModalBodyProps) => {
  switch (type) {
    case "stripe":
      return (
        <div className="flex flex-col gap-2">
          <h2 className="font-bold">Stripe would like to access</h2>
          {[
            "Payment and bank information",
            "Services you offer",
            "Business and tax information",
            "Create and update Services",
          ].map((item, key) => (
            <div key={key} className="flex gap-2 items-center pl-3">
              <CheckCircle2Icon />
              <p>{item}</p>
            </div>
          ))}
          <div className="flex justify-between mt-10">
            <Button variant="outline">Learn more</Button>
            <StripeConnect connected={connections[type]} />
          </div>
        </div>
      );
    default:
      return <></>;
  }
};
