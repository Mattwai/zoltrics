import { onGetDomainServicesAndConnectedAccountId } from "@/actions/payments";
import CustomerPaymentForm from "@/components/forms/portal/customer-payment-form";
import { redirect } from "next/navigation";

type Props = {
  params: {
    domainid: string;
    customerid: string;
  };
};

const Page = async ({ params }: Props) => {
  const services = await onGetDomainServicesAndConnectedAccountId(
    params.domainid
  );

  if (!services) {
    redirect("/dashboard");
  }

  return (
    <CustomerPaymentForm
      services={services?.services}
      amount={services?.amount}
      customerId={params.customerid}
      domainId={params.domainid}
      stripeId={services?.stripeId!}
    />
  );
};

export default Page;
