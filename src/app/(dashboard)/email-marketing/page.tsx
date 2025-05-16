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
  const campaignsData = await onGetAllCampaigns(session.user.id);
  
  console.log('Customers data:', JSON.stringify(customers, null, 2));

  // Transform data to match EmailMarketing component props
  const formattedCampaigns = campaignsData?.campaigns?.map(campaign => ({
    name: campaign.name,
    id: campaign.id,
    createdAt: campaign.createdAt,
    // Map customers array to just an array of IDs as expected
    customers: campaign.customers.map(customer => customer.customerId)
  })) || [];

  // Format subscription to match expected type
  const subscription = customers?.subscription ? {
    plan: (customers.subscription.plan || "STANDARD") as "STANDARD" | "PRO" | "BUSINESS",
    credits: customers.subscription.credits
  } : null;

  // Simplified hardcoded domains as a temporary solution
  // This should be replaced with proper data transformation when structure is known
  const domains = [
    {
      customer: customers?.domains?.[0]?.customers.map(cust => ({
        Domain: { name: "Domain" },
        id: cust.id,
        email: cust.email 
      })) || []
    }
  ];

  return (
    <>
      <InfoBar></InfoBar>
      <EmailMarketing
        campaign={formattedCampaigns}
        subscription={subscription}
        domains={domains}
      />
    </>
  );
};

export default Page;
