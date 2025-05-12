import InfoBar from "@/components/infobar";
import BillingSettings from "./billing-settings";
import DarkModetoggle from "./dark-mode";
import { authConfig } from "@/lib/auth";
import { onGetUser } from "@/actions/settings";
import { getServerSession } from "next-auth";
import { BusinessName } from "../appointment-settings/business-name";
import { RoleBadge } from "@/components/ui/role-badge";

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
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">Account Settings</h2>
              <RoleBadge role={session.user.role || "USER"} className="text-sm px-4 py-1.5" />
            </div>
            <BusinessName 
              userId={session.user.id}
              initialBusinessName={user?.userBusinessProfile?.businessName || null}
            />
          </div>
          <BillingSettings />
          <DarkModetoggle />
        </div>
      </div>
    </div>
  );
};

export default Page;
