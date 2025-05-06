import InfoBar from "@/components/infobar";
import BillingSettings from "./billing-settings";
import DarkModetoggle from "./dark-mode";
import { authConfig } from "@/lib/auth";
import { onGetUser } from "@/actions/settings";
import { getServerSession } from "next-auth";

type Props = {};

const Page = async (props: Props) => {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) return null;

  // Fetch user details including booking link
  const user = await onGetUser();
  
  return (
    <>
      <InfoBar />
      <div className="overflow-y-auto w-full chat-window flex-1 h-0 flex flex-col gap-10 px-2">
        <BillingSettings />
        <DarkModetoggle />
      </div>
    </>
  );
};

export default Page;
