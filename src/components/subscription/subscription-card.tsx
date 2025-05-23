import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type Props = {
  title: string;
  description: string;
  price: string;
  onPayment(payment: string): void;
  payment: string;
  id: string;
};

const SubscriptionCard = ({
  title,
  description,
  price,
  onPayment,
  payment,
  id,
}: Props) => {
  return (
    <div onClick={() => onPayment(id)}>
      <Card
        className={cn(
          "w-full cursor-pointer transition-colors hover:border-purple",
          payment === id && "border-purple"
        )}
      >
        <CardContent className="flex justify-between p-2">
          <div className="flex items-center gap-3">
            <Card className={cn("flex justify-center p-3 border-none")}>
              <CardTitle>${price}</CardTitle>
            </Card>
            <div className="">
              <CardDescription className="font-bold">{title}</CardDescription>
              <CardDescription className="font-light">
                {description}
              </CardDescription>
            </div>
          </div>
          <div>
            <div
              className={cn(
                "w-4 h-4 rounded-full",
                payment === id ? "bg-orchid" : "bg-platinum"
              )}
            />
            <Input
              value={id}
              id={id}
              className="hidden"
              type="radio"
              checked={payment === id}
              onChange={() => onPayment(id)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionCard;
