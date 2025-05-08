import InfoBar from "@/components/infobar";
import BillingSettings from "./billing-settings";
import DarkModetoggle from "./dark-mode";
import { authConfig } from "@/lib/auth";
import { onGetUser } from "@/actions/settings";
import { getServerSession } from "next-auth";
import { BusinessName } from "../appointment-settings/business-name";

type Props = {};

const Page = async (props: Props) => {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) return null;

  // Fetch user details including booking link
  const user = await onGetUser();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-4 px-4">
        <InfoBar />
        <div className="flex flex-col gap-10">
          <BusinessName 
            userId={session.user.id}
            initialBusinessName={user?.userBusinessProfile?.businessName || null}
          />
          <BillingSettings />
          {/* <DarkModetoggle /> */}
        </div>
      </div>
    </div>
  );
};

export default Page;
