import { onGetAllCampaigns, onGetAllCustomers } from "@/actions/mail";
import EmailMarketing from "@/components/email-marketing";
import InfoBar from "@/components/infobar";
import { authConfig } from "@/lib/auth";
import { getServerSession } from "next-auth";

type Props = {};

const Page = async (props: Props) => {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) return null;

  const customers = await onGetAllCustomers(session.user.id);
  const campaigns = await onGetAllCampaigns(session.user.id);

  return (
    <>
      <InfoBar></InfoBar>
      <EmailMarketing
        campaign={campaigns?.campaign!}
        subscription={customers?.subscription!}
        domains={customers?.domains!}
      />
    </>
  );
};

export default Page;
