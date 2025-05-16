import { onGetCurrentDomainInfo } from "@/actions/settings";
import BotTrainingForm from "@/components/forms/settings/bot-training";
import SettingsForm from "@/components/forms/settings/form";
import InfoBar from "@/components/infobar";
import ServiceTable from "@/components/forms/services";
import { redirect } from "next/navigation";
import { Plans } from "@/types/prisma";

type Props = { params: { domain: string } };

const DomainSettingsPage = async ({ params }: Props) => {
  const domain = await onGetCurrentDomainInfo(params.domain);
  if (!domain) redirect("/dashboard");

  const plan = domain.subscription?.plan || "STANDARD";
  if (!["STANDARD", "PROFESSIONAL", "BUSINESS"].includes(plan)) {
    redirect("/dashboard");
  }

  return (
    <>
      <InfoBar />
      <div className="overflow-y-auto w-full chat-window flex-1 h-0">
        <SettingsForm
          plan={plan as "STANDARD" | "PROFESSIONAL" | "BUSINESS"}
          chatBot={domain.domains[0].user?.chatBot ?? null}
          id={domain.domains[0].id}
          name={domain.domains[0].name}
        />
        <BotTrainingForm 
          id={domain.domains[0].id} 
          plan={plan as Plans} 
        />
        <ServiceTable
          id={domain.domains[0].id}
          services={domain.domains[0].services || []}
        />
      </div>
    </>
  );
};

export default DomainSettingsPage;
