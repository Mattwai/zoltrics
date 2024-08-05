"use client";

import { onGetAllAccountDomains } from "@/actions/settings";
import ConversationMenu from "@/components/conversations";
import Messenger from "@/components/conversations/messenger";
import InfoBar from "@/components/infobar";
import { Separator } from "@/components/ui/separator";
import { Domain } from "@/types/types";
import { useEffect, useState } from "react";

type Props = {};

const ConversationPage: React.FC<Props> = (props: Props) => {
  const [domains, setDomains] = useState<Domain[] | null>(null);

  useEffect(() => {
    const fetchDomains = async () => {
      const domainsData = await onGetAllAccountDomains();
      setDomains(domainsData);
    };

    fetchDomains();
  }, []);

  return (
    <div className="w-full h-full flex">
      <ConversationMenu domains={domains?.map((domain) => domain)} />

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
