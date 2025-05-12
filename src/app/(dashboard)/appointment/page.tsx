import { onGetAllBookingsForCurrentUser } from "@/actions/appointment";
import { onGetUser } from "@/actions/settings";
import InfoBar from "@/components/infobar";
import { authConfig } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { AppointmentClient } from "./appointment-client";

type Props = {};

const Page = async (props: Props) => {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    console.error("No session or user ID found");
    return null;
  }

  try {
    const allBookings = await onGetAllBookingsForCurrentUser(session.user.id);
    const user = await onGetUser();
    
    if (!user) {
      console.error("Failed to fetch user data");
      return null;
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-4 px-4">
          <InfoBar />
          <AppointmentClient 
            initialBookings={allBookings?.bookings || []}
            userId={session.user.id}
            bookingLink={user.userBusinessProfile?.bookingLink?.link || null}
            baseUrl={process.env.NEXT_PUBLIC_BASE_URL || ""}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in appointment page:", error);
    return null;
  }
};

export default Page;
