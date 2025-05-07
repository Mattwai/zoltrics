import { onGetAllBookingsForCurrentUser } from "@/actions/appointment";
import { onGetUser } from "@/actions/settings";
import AllAppointments from "@/components/appointment/all-appointment";
import InfoBar from "@/components/infobar";
import BookingLink from "@/app/(dashboard)/appointment-settings/booking-link";
import Section from "@/components/section-label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { authConfig } from "@/lib/auth";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

type Props = {};

interface Booking {
  id: string;
  name: string;
  slot: string;
  createdAt: Date;
  date: Date;
  email: string;
  domainId: string | null;
  customerId: string | null;
  source?: string;
  depositRequired: boolean;
  depositPaid: boolean;
  no_show: boolean;
  riskScore: number;
  updatedAt: Date;
  Customer: {
    Domain: {
      name: string;
    } | null;
  } | null;
}

const Page = async (props: Props) => {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    console.error("No session or user ID found");
    return null;
  }

  try {
    const allBookings = await onGetAllBookingsForCurrentUser(session.user.id);
    const today = new Date();

    // Fetch user details including booking link
    const user = await onGetUser();
    if (!user) {
      console.error("Failed to fetch user data");
      return null;
    }

    // Type assertion to match the expected Booking interface
    const typedBookings = (allBookings?.bookings || []) as Booking[];
    
    const bookingsExistToday = typedBookings.filter(
      (booking) => booking.date.getDate() === today.getDate()
    );

    return (
      <>
        <InfoBar />
        <div className="grid grid-cols-1 lg:grid-cols-3 flex-1 h-0 gap-3">
          <div className="lg:col-span-2 overflow-y-auto px-2">
            <Section
              label="Direct Booking Link" 
              message="Create and share a unique booking link with your customers."
            />
            <div className="mb-6">
              <BookingLink 
                userId={session.user.id}
                initialBookingLink={user.userBusinessProfile?.bookingLink || null}
                baseUrl={process.env.NEXT_PUBLIC_BASE_URL || ""}
              />
            </div>
            <h2 className="text-lg font-semibold">All Appointments</h2>
            <AllAppointments bookings={typedBookings} />
          </div>
          <div className="col-span-1 pr-5">
            <Section
              label="Bookings For Today"
              message="All your bookings for today are below:"
            />
            {bookingsExistToday.length ? (
              bookingsExistToday.map((booking) => (
                <Card
                  key={booking.id}
                  className="rounded-xl overflow-hidden mt-4"
                >
                  <CardContent className="p-0 flex">
                    <div className="w-4/12 text-xl bg-orchid py-10 flex justify-center items-center font-bold">
                      {booking.slot}
                    </div>
                    <div className="flex flex-col flex-1">
                      <div className="flex justify-between w-full p-3">
                        <p className="text-sm">
                          Name
                          <br />
                          {booking.name}
                        </p>
                        <p className="text-sm">
                          Booking Type <br />
                          {booking.Customer?.Domain?.name || "Direct Booking"}
                        </p>
                      </div>
                      <Separator orientation="horizontal" />
                      <div className="w-full flex items-center p-3 gap-2">
                        <p className="text-sm">{booking.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="w-full flex justify-center py-2">
                <p>No Appointments For Today</p>
              </div>
            )}
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error("Error in appointment page:", error);
    return null;
  }
};

export default Page;
