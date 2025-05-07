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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <InfoBar />
        <div className="flex flex-col gap-10">
          <BillingSettings />
          <DarkModetoggle />
        </div>
      </div>
    </div>
  );
};

export default Page;
