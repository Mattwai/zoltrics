"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/appointment/date-picker";
import { Booking } from "@/types/booking";
import AllAppointments from "@/components/appointment/all-appointment";
import Section from "@/components/section-label";
import BookingLink from "@/app/(dashboard)/appointment-settings/booking-link";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteAppointmentDialog } from "@/components/appointment/delete-appointment-dialog";
import { BookingOptionsDialog } from "@/components/appointment/booking-options-dialog";
import { formatTimeSlot } from "@/lib/time-slots";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const filteredBookings = initialBookings.filter((booking) => {
        const bookingDate = new Date(booking.startTime);
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

  const openBookingDialog = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setBookingDialogOpen(true);
  };

  const closeBookingDialog = () => {
    setBookingDialogOpen(false);
    setSelectedBookingId(null);
  };

  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
    setBookingDialogOpen(false);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedBookingId) return;
    
    try {
      setIsDeleting(selectedBookingId);
      const response = await fetch(`/api/appointments/${selectedBookingId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to delete appointment");
      }

      // Update local state
      setBookings((prev) => prev.filter((booking) => booking.id !== selectedBookingId));
      toast.success("Appointment deleted successfully");
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete appointment");
    } finally {
      setIsDeleting(null);
      setDeleteDialogOpen(false);
      setSelectedBookingId(null);
    }
  };

  // Handle updates to booking information (notes, rescheduling, etc.)
  const handleBookingUpdate = (updatedBooking: Booking) => {
    // Update the local state with the updated booking
    setBookings(prevBookings => 
      prevBookings.map(booking => 
        booking.id === updatedBooking.id ? updatedBooking : booking
      )
    );
    
    // Also update in the initialBookings reference if it exists
    const index = initialBookings.findIndex(b => b.id === updatedBooking.id);
    if (index !== -1) {
      initialBookings[index] = updatedBooking;
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      booking.customer?.name.toLowerCase().includes(query) ||
      booking.customer?.email.toLowerCase().includes(query) ||
      formatTimeSlot(booking.startTime.toISOString(), 60).toLowerCase().includes(query) ||
      (booking.customer?.domain?.name || "").toLowerCase().includes(query)
    );
  });

  const todayBookings = filteredBookings.filter((booking) => {
    const today = new Date();
    const bookingDate = new Date(booking.startTime);
    return (
      bookingDate.getFullYear() === today.getFullYear() &&
      bookingDate.getMonth() === today.getMonth() &&
      bookingDate.getDate() === today.getDate()
    );
  });

  const selectedBooking = selectedBookingId 
    ? bookings.find(booking => booking.id === selectedBookingId) || null 
    : null;

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
                      {formatTimeSlot(booking.startTime.toISOString(), 60)}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="text-base">{booking.customer?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-base">{booking.customer?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Booking Type</p>
                      <p className="text-base">
                        {booking.customer?.domain?.name || "Direct Booking"}
                      </p>
                    </div>
                    {booking.bookingPayment && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Payment Status</p>
                        <p className={cn(
                          "text-base",
                          booking.bookingPayment.status === "completed" ? "text-green-600" : "text-amber-600"
                        )}>
                          {booking.bookingPayment.status === "completed" ? "Paid" : "Pending"}
                        </p>
                      </div>
                    )}
                    {booking.bookingMetadata?.notes && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Notes</p>
                        <p className="text-base">{booking.bookingMetadata.notes}</p>
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
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <DatePicker onDateChange={handleDateChange} />
                </div>
              </div>
            </div>
            <div className="p-6">
              <AllAppointments 
                bookings={filteredBookings} 
                onBookingOptions={openBookingDialog}
                isDeleting={isDeleting}
              />
            </div>
          </div>
        </div>
      </div>

      {selectedBooking && (
        <BookingOptionsDialog
          isOpen={bookingDialogOpen}
          onClose={closeBookingDialog}
          booking={selectedBooking}
          onCancel={openDeleteDialog}
          onBookingUpdate={handleBookingUpdate}
        />
      )}

      <DeleteAppointmentDialog
        isOpen={deleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        isDeleting={!!isDeleting}
      />
    </div>
  );
}; 