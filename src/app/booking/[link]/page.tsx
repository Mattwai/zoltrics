import { onGetUserByBookingLink } from "@/actions/appointment";
import BookingForm from "@/components/forms/booking/booking-form";
import AiChatBot from "@/components/chatbot";
import { redirect } from "next/navigation";

type Props = {
  params: {
    link: string;
  };
};

const BookingPage = async ({ params }: Props) => {
  const user = await onGetUserByBookingLink(params.link);

  if (!user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Book an Appointment with {user.name || "Us"}
        </h1>
        <BookingForm userId={user.id} />
      </div>
      <div className="fixed bottom-4 right-4 z-50">
        <AiChatBot 
          userId={user.id} 
          initialChatBot={{
            name: user.name || "BookerBuddy",
            chatBot: user.chatBot,
            helpdesk: user.helpdesk || [],
          }}
        />
      </div>
    </div>
  );
};

export default BookingPage;
