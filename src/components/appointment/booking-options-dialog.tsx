"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "./date-picker";
import { Booking } from "@/types/booking";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Sample time slots - replace with your application's actual available slots
const AVAILABLE_SLOTS = [
  "9:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "1:00 PM - 2:00 PM",
  "2:00 PM - 3:00 PM",
  "3:00 PM - 4:00 PM",
  "4:00 PM - 5:00 PM",
];

interface BookingOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onCancel: () => void;
  onBookingUpdate?: (updatedBooking: Booking) => void;
}

export const BookingOptionsDialog = ({
  isOpen,
  onClose,
  booking,
  onCancel,
  onBookingUpdate,
}: BookingOptionsDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    booking ? new Date(booking.date) : undefined
  );
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [originalNotes, setOriginalNotes] = useState<string>("");
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const hasFetchedRef = useRef(false);

  // Reset fetch flag when dialog closes
  useEffect(() => {
    if (!isOpen) {
      hasFetchedRef.current = false;
    }
  }, [isOpen]);

  // Fetch latest booking data from the database when dialog opens
  useEffect(() => {
    // Only fetch once when the dialog opens for a booking
    if (booking && isOpen && !hasFetchedRef.current) {
      hasFetchedRef.current = true; // Set immediately to prevent duplicate fetches

      const fetchBookingData = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/appointments/${booking.id}/details`);
          
          if (response.ok) {
            const data = await response.json();
            setCurrentBooking(data);
            setSelectedSlot(data.slot);
            const bookingNotes = data.notes || "";
            setNotes(bookingNotes);
            setOriginalNotes(bookingNotes);
            setSelectedDate(new Date(data.date));
            
            // Update parent component with fresh data
            if (onBookingUpdate) {
              onBookingUpdate(data);
            }
          } else {
            // Fall back to the booking data passed by props
            setCurrentBooking(booking);
            setSelectedSlot(booking.slot);
            const bookingNotes = booking.notes || "";
            setNotes(bookingNotes);
            setOriginalNotes(bookingNotes);
            setSelectedDate(new Date(booking.date));
          }
        } catch (error) {
          console.error("Error fetching booking details:", error);
          // Fall back to the booking data passed by props
          setCurrentBooking(booking);
          setSelectedSlot(booking.slot);
          const bookingNotes = booking.notes || "";
          setNotes(bookingNotes);
          setOriginalNotes(bookingNotes);
          setSelectedDate(new Date(booking.date));
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchBookingData();
    }
  }, [booking, isOpen, onBookingUpdate]);

  // Handle date change manually since DatePicker manages its own state
  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  if (!booking) return null;

  // Use currentBooking if available, otherwise use booking from props
  const activeBooking = currentBooking || booking;

  const handleUpdateNotes = async () => {
    if (!activeBooking) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/appointments/${activeBooking.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to update notes");
      }

      // Get the updated booking data from the response
      const updatedBooking = await response.json();
      
      // Update current booking with the new data
      setCurrentBooking({
        ...activeBooking,
        notes: notes
      });
      
      // Update original notes after successful save
      setOriginalNotes(notes);
      
      // Update the parent component with the new booking data including notes
      if (onBookingUpdate) {
        onBookingUpdate({
          ...activeBooking,
          notes: notes
        });
      }
      
      toast.success("Notes updated successfully");
    } catch (error) {
      console.error("Error updating notes:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update notes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!activeBooking || !selectedDate || !selectedSlot) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/appointments/${activeBooking.id}/reschedule`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          date: selectedDate.toISOString(),
          slot: selectedSlot 
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to reschedule appointment");
      }

      // Get the updated booking data from the response
      const updatedBooking = await response.json();
      
      // Update current booking with the new data
      setCurrentBooking({
        ...activeBooking,
        date: new Date(selectedDate),
        slot: selectedSlot,
        notes: notes
      });
      
      // Update the parent component with the new booking data
      if (onBookingUpdate) {
        onBookingUpdate({
          ...activeBooking,
          date: new Date(selectedDate),
          slot: selectedSlot,
          // Preserve notes in case they were edited but not saved
          notes: notes
        });
      }

      toast.success("Appointment rescheduled successfully");
      onClose();
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to reschedule appointment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = () => {
    // Only close, no auto-save
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Booking Options - {activeBooking.name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Booking Details Section */}
          <div className="grid gap-2">
            <h3 className="text-sm font-medium text-gray-500">Booking Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-500">Date</Label>
                <p>{activeBooking.date ? new Date(activeBooking.date).toLocaleDateString() : "Not set"}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Time</Label>
                <p>{activeBooking.slot}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Email</Label>
                <p>{activeBooking.email}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Type</Label>
                <p>{activeBooking.Customer?.Domain?.name || "Direct Booking"}</p>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          {activeBooking.bookingPayment && (
            <div className="grid gap-2">
              <h3 className="text-sm font-medium text-gray-500">Payment Status</h3>
              <div className="flex items-center gap-2">
                <p className="text-sm">Deposit:</p>
                <p
                  className={cn(
                    "text-sm font-medium",
                    activeBooking.bookingPayment.depositPaid
                      ? "text-green-600"
                      : "text-amber-600"
                  )}
                >
                  {activeBooking.bookingPayment.depositPaid ? "Paid" : "Pending"}
                </p>
              </div>
            </div>
          )}

          {/* Notes Section - Moved up before reschedule section */}
          <div className="grid gap-2">
            <h3 className="text-sm font-medium text-gray-500">Additional Notes</h3>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes or special requests..."
              rows={4}
              disabled={isLoading}
            />
          </div>

          {/* Reschedule Section */}
          <div className="grid gap-2">
            <h3 className="text-sm font-medium text-gray-500">Reschedule Booking</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reschedule-date">New Date</Label>
                <DatePicker
                  onDateChange={handleDateChange}
                />
              </div>
              <div>
                <Label htmlFor="reschedule-slot">New Time Slot</Label>
                <Select value={selectedSlot} onValueChange={setSelectedSlot} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_SLOTS.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex w-full justify-between">
            <Button
              variant="destructive"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel Booking
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Close
              </Button>
              <Button
                onClick={handleUpdateNotes}
                disabled={isLoading || notes === originalNotes}
              >
                Save Notes
              </Button>
              <Button
                onClick={handleReschedule}
                disabled={
                  isLoading ||
                  !selectedDate ||
                  !selectedSlot ||
                  (selectedDate.getTime() === new Date(activeBooking.date).getTime() &&
                   selectedSlot === activeBooking.slot)
                }
              >
                Reschedule
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};