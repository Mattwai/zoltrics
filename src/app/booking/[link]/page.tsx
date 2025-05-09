import { redirect } from "next/navigation";
import BookingForm from "@/components/forms/booking/booking-form";
import AiChatBot from "@/components/chatbot";
import { UserWithRelations } from "@/types/prisma";
import { onGetUserByBookingLink } from "@/actions/appointment";

interface Props {
  params: {
    link: string;
  };
}

interface BookingFormService {
  id: string;
  name: string;
  price: number;
  isLive: boolean;
}

const BookingPage = async ({ params }: Props) => {
  const user = await onGetUserByBookingLink(params.link);

  if (!user) {
    redirect("/");
  }

  // Get all live services from all domains
  const allServices = user.domains.flatMap((domain: { services: any[] }) => domain.services);
  const services = allServices
    .filter((service: { status?: { isLive: boolean } }) => service.status?.isLive)
    .map((service: { id: string; name: string; pricing?: { price: number }; status?: { isLive: boolean } }) => ({
      id: service.id,
      name: service.name,
      price: service.pricing?.price || 0,
      isLive: service.status?.isLive || false
    })) as BookingFormService[];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
              <AiChatBot userId={user.id} />
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
              <BookingForm userId={user.id} services={services} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
