"use client";

import { useState, useEffect } from "react";
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
}

export const BookingOptionsDialog = ({
  isOpen,
  onClose,
  booking,
  onCancel,
}: BookingOptionsDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    booking ? new Date(booking.date) : undefined
  );
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (booking) {
      setSelectedSlot(booking.slot);
      setNotes(booking.notes || "");
      setSelectedDate(new Date(booking.date));
    }
  }, [booking]);

  if (!booking) return null;

  const handleUpdateNotes = async () => {
    if (!booking) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/appointments/${booking.id}`, {
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

      toast.success("Notes updated successfully");
    } catch (error) {
      console.error("Error updating notes:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update notes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!booking || !selectedDate || !selectedSlot) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/appointments/${booking.id}/reschedule`, {
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

      toast.success("Appointment rescheduled successfully");
      onClose();
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to reschedule appointment");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Booking Options - {booking.name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Booking Details Section */}
          <div className="grid gap-2">
            <h3 className="text-sm font-medium text-gray-500">Booking Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-500">Date</Label>
                <p>{booking.date ? new Date(booking.date).toLocaleDateString() : "Not set"}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Time</Label>
                <p>{booking.slot}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Email</Label>
                <p>{booking.email}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Type</Label>
                <p>{booking.Customer?.Domain?.name || "Direct Booking"}</p>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          {booking.bookingPayment && (
            <div className="grid gap-2">
              <h3 className="text-sm font-medium text-gray-500">Payment Status</h3>
              <div className="flex items-center gap-2">
                <p className="text-sm">Deposit:</p>
                <p
                  className={cn(
                    "text-sm font-medium",
                    booking.bookingPayment.depositPaid
                      ? "text-green-600"
                      : "text-amber-600"
                  )}
                >
                  {booking.bookingPayment.depositPaid ? "Paid" : "Pending"}
                </p>
              </div>
            </div>
          )}

          {/* Reschedule Section */}
          <div className="grid gap-2">
            <h3 className="text-sm font-medium text-gray-500">Reschedule Booking</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reschedule-date">New Date</Label>
                <DatePicker
                  onDateChange={setSelectedDate}
                />
              </div>
              <div>
                <Label htmlFor="reschedule-slot">New Time Slot</Label>
                <Select value={selectedSlot} onValueChange={setSelectedSlot}>
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

          {/* Notes Section */}
          <div className="grid gap-2">
            <h3 className="text-sm font-medium text-gray-500">Additional Notes</h3>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes or special requests..."
              rows={4}
            />
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
                disabled={isLoading || !notes}
              >
                Save Notes
              </Button>
              <Button
                onClick={handleReschedule}
                disabled={
                  isLoading ||
                  !selectedDate ||
                  !selectedSlot ||
                  (selectedDate.getTime() === new Date(booking.date).getTime() &&
                   selectedSlot === booking.slot)
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