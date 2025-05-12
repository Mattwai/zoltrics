import InfoBar from "@/components/infobar";
import { BookingCalendarSettings } from "./booking-calendar-settings";
import { CustomTimeSlots } from "./custom-time-slots";
import { authConfig } from "@/lib/auth";
import { getServerSession } from "next-auth";

type Props = {};

const Page = async (props: Props) => {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) return null;
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4 px-4">
        <InfoBar />
        <div className="flex flex-col gap-10">
          <BookingCalendarSettings userId={session.user.id} />
          <CustomTimeSlots userId={session.user.id} />
        </div>
      </div>
    </div>
  );
};

export default Page; 