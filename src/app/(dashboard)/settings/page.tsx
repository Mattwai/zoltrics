import InfoBar from "@/components/infobar";
import BillingSettings from "@/components/settings/billing-settings";
import DarkModetoggle from "@/components/settings/dark-mode";
import UserInfoSettings from "@/components/settings/user-info-settings";

type Props = {};

const Page = (props: Props) => {
  return (
    <>
      <InfoBar />
      <div className="overflow-y-auto w-full chat-window flex-1 h-0 flex flex-col gap-10">
        <UserInfoSettings />
        <BillingSettings />
        <DarkModetoggle />
      </div>
    </>
  );
};

export default Page;
