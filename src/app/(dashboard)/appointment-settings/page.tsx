import InfoBar from "@/components/infobar";
import BookingLink from "@/app/(dashboard)/appointment-settings/booking-link";
import { BookingCalendarSettings } from "@/app/(dashboard)/appointment-settings/booking-calendar-settings";
import { CustomTimeSlots } from "@/app/(dashboard)/appointment-settings/custom-time-slots";
import { authConfig } from "@/lib/auth";
import { onGetUser } from "@/actions/settings";
import { getServerSession } from "next-auth";

type Props = {};

const Page = async (props: Props) => {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) return null;

  // Fetch user details including booking link
  const user = await onGetUser();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <InfoBar />
        <div className="flex flex-col gap-10">
          <BookingLink               
            userId={session.user.id}
            initialBookingLink={user?.userBusinessProfile?.bookingLink || null}
            baseUrl={process.env.NEXT_PUBLIC_BASE_URL || ""}/>
          <BookingCalendarSettings userId={session.user.id} />
          <CustomTimeSlots userId={session.user.id} />
        </div>
      </div>
    </div>
  );
};

export default Page; 