import { onGetPaymentConnected } from "@/actions/settings";
import InfoBar from "@/components/infobar";
import IntegrationsList from "@/components/integrations";

const IntegrationsPage = async () => {
  const payment = await onGetPaymentConnected();

  const connections = {
    stripe: payment ? true : false,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-4 px-4">
        <InfoBar />
        <IntegrationsList connections={connections} />
      </div>
    </div>
  );
};

export default IntegrationsPage;
