import InfoBar from "@/components/infobar";
import BookingLink from "@/components/settings/booking-link";
import { BookingCalendarSettings } from "@/components/settings/booking-calendar-settings";
import { CustomTimeSlots } from "@/components/settings/custom-time-slots";
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
    <>
      <InfoBar />
      <div className="overflow-y-auto w-full chat-window flex-1 h-0 flex flex-col gap-10 px-2">
        <BookingLink               
          userId={session.user.id}
          initialBookingLink={user?.bookingLink || null}
          baseUrl={process.env.NEXT_PUBLIC_BASE_URL || ""}/>
        <BookingCalendarSettings userId={session.user.id} />
        <CustomTimeSlots userId={session.user.id} />
      </div>
    </>
  );
};

export default Page; 