import { ProgressBar } from "../progress";

type PlanUsageProps = {
  plan: "FREE" | "STANDARD" | "PROFESSIONAL";
  credits: number;
  domains: number;
  clients: number;
};

export const PlanUsage = ({
  plan,
  credits,
  domains,
  clients,
}: PlanUsageProps) => {
  return (
    <div className="flex flex-col gap-5 py-3">
      <ProgressBar
        end={plan == "FREE" ? 10 : plan == "STANDARD" ? 50 : 500}
        label="Email Credits"
        credits={credits}
      />
      <ProgressBar
        end={plan == "FREE" ? 1 : plan == "STANDARD" ? 2 : 100}
        label="Domains"
        credits={domains}
      />
      <ProgressBar
        end={plan == "FREE" ? 10 : plan == "STANDARD" ? 50 : 500}
        label="Contacts"
        credits={clients}
      />
    </div>
  );
};
