import { onGetAllAccountDomains } from "@/actions/settings";
import ConversationMenu from "@/components/conversations";
import Messenger from "@/components/conversations/messenger";
import InfoBar from "@/components/infobar";
import { Separator } from "@/components/ui/separator";

type Props = {};

const ConversationPage = async (props: Props) => {
  const domainsData = await onGetAllAccountDomains();
  
  // Map to the format expected by ConversationMenu
  const formattedDomains = domainsData?.map(domain => ({
    name: domain.name,
    id: domain.id
  }));
  
  return (
    <div className="w-full h-full flex">
      <ConversationMenu domains={formattedDomains} />

      <Separator orientation="vertical" />
      <div className="w-full flex flex-col">
        <div className="px-5">
          <InfoBar />
        </div>
        <Messenger />
      </div>
    </div>
  );
};

export default ConversationPage;
