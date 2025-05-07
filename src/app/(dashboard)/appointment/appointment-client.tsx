"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DatePicker } from "./date-picker";
import { Booking } from "@/types/booking";
import AllAppointments from "@/components/appointment/all-appointment";
import Section from "@/components/section-label";
import BookingLink from "@/app/(dashboard)/appointment-settings/booking-link";

interface AppointmentClientProps {
  initialBookings: Booking[];
  userId: string;
  bookingLink: string | null;
  baseUrl: string;
}

export const AppointmentClient = ({
  initialBookings,
  userId,
  bookingLink,
  baseUrl,
}: AppointmentClientProps) => {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const filteredBookings = initialBookings.filter((booking) => {
        const bookingDate = new Date(booking.date);
        return (
          bookingDate.getFullYear() === date.getFullYear() &&
          bookingDate.getMonth() === date.getMonth() &&
          bookingDate.getDate() === date.getDate()
        );
      });
      setBookings(filteredBookings);
    } else {
      setBookings(initialBookings);
    }
  };

  const todayBookings = bookings.filter((booking) => {
    const today = new Date();
    const bookingDate = new Date(booking.date);
    return (
      bookingDate.getFullYear() === today.getFullYear() &&
      bookingDate.getMonth() === today.getMonth() &&
      bookingDate.getDate() === today.getDate()
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Today's Bookings */}
      <div className="lg:col-span-1">
        <Section
          label="Today's Appointments"
          message={`You have ${todayBookings.length} appointment(s) today`}
        />
        <div className="space-y-4">
          {todayBookings.length ? (
            todayBookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden">
                <CardHeader className="bg-orchid/10 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">
                      {booking.slot}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        // TODO: Implement cancel appointment
                        console.log("Cancel appointment:", booking.id);
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="text-base">{booking.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-base">{booking.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Booking Type</p>
                      <p className="text-base">
                        {booking.Customer?.Domain?.name || "Direct Booking"}
                      </p>
                    </div>
                    {booking.bookingPayment?.depositRequired && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Deposit Status</p>
                        <p className={cn(
                          "text-base",
                          booking.bookingPayment.depositPaid ? "text-green-600" : "text-amber-600"
                        )}>
                          {booking.bookingPayment.depositPaid ? "Paid" : "Pending"}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500">No appointments scheduled for today</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Right Column - All Appointments */}
      <div className="lg:col-span-2">
        <div className="flex flex-col gap-6">
          <Section
            label="Direct Booking Link" 
            message="Create and share a unique booking link with your customers."
          />
          <div className="mb-6">
            <BookingLink 
              userId={userId}
              initialBookingLink={bookingLink}
              baseUrl={baseUrl}
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <h2 className="text-lg font-semibold">All Appointments</h2>
                <div className="flex gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search appointments..."
                      className="pl-8"
                      // TODO: Implement search functionality
                    />
                  </div>
                  <DatePicker onDateChange={handleDateChange} />
                </div>
              </div>
            </div>
            <div className="p-6">
              <AllAppointments bookings={bookings} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 