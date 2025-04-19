import InfoBar from "@/components/infobar";
import BillingSettings from "@/components/settings/billing-settings";
import BookingLink from "@/components/settings/booking-link";
import ChangePassword from "@/components/settings/change-password";
import DarkModetoggle from "@/components/settings/dark-mode";
import { authConfig } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";

type Props = {};

const Page = async (props: Props) => {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) return null;

  // Fetch user details including booking link
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { bookingLink: true }
  });
  return (
    <>
      <InfoBar />
      <div className="overflow-y-auto w-full chat-window flex-1 h-0 flex flex-col gap-10 px-2">
        <BillingSettings />
        <BookingLink               
          userId={session.user.id}
          initialBookingLink={user?.bookingLink || null}
          baseUrl={process.env.NEXT_PUBLIC_BASE_URL || ""}/>
        <DarkModetoggle />
        {/* <ChangePassword /> */}
      </div>
    </>
  );
};

export default Page;
