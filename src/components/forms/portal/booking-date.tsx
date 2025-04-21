import { Loader } from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { FieldValues, UseFormRegister } from "react-hook-form";

interface TimeSlot {
  slot: string;
  duration?: number;
  maxSlots?: number;
}

type Props = {
  date: Date | undefined;
  onBooking: React.Dispatch<React.SetStateAction<Date | undefined>>;
  onBack(): void;
  register: UseFormRegister<FieldValues>;
  onSlot(slot: string): void;
  currentSlot?: string;
  loading: boolean;
  bookings:
    | {
        date: Date;
        slot: string;
      }[]
    | undefined;
  userId: string;
};

const BookAppointmentDate = ({
  date,
  onBooking,
  onBack,
  register,
  onSlot,
  currentSlot,
  loading,
  bookings,
  userId,
}: Props) => {
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);

  useEffect(() => {
    if (date && userId) {
      fetchTimeSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [date, userId]);

  const fetchTimeSlots = async () => {
    if (!date || !userId) return;
    
    setIsLoadingSlots(true);
    try {
      const response = await fetch(`/api/bookings/available-slots?date=${date.toISOString()}&userId=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch time slots");
      }
      const data = await response.json();
      setAvailableSlots(data.slots || []);
    } catch (error) {
      console.error("Error fetching time slots:", error);
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 justify-center">
      <div className="flex justify-center">
        <h2 className="text-4xl font-bold mb-5">Book a meeting</h2>
      </div>
      <div className="flex gap-10 flex-col sm:flex-row">
        <div className="w-[300px]">
          <h6>Discovery Call</h6>
          <CardDescription>
            During this call, we aim to explore potential avenues for
            partnership, promotional opportunities, or any other means through
            which we can contribute to the success of your company.
          </CardDescription>
        </div>
        <div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={onBooking}
            className="rounded-md border"
          />
        </div>
        <div className="flex flex-col gap-5">
          {isLoadingSlots ? (
            <div className="text-center">Loading available time slots...</div>
          ) : availableSlots.length > 0 ? (
            availableSlots.map((slot, index) => (
              <Label htmlFor={`slot-${index}`} key={index}>
                <Card
                  onClick={() => onSlot(slot.slot)}
                  className={cn(
                    currentSlot === slot.slot ? "bg-grandis" : "bg-peach",
                    "px-10 py-4",
                    bookings &&
                      bookings.some(
                        (booking) =>
                          `${booking.date.getDate()}/${booking.date.getMonth()}` ===
                            `${date?.getDate()}/${date?.getMonth()}` &&
                          booking.slot === slot.slot
                      )
                      ? "bg-gray-300"
                      : "cursor-pointer border-orange hover:bg-grandis transition duration-150 ease-in-out"
                  )}
                >
                  <Input
                    {...(bookings &&
                    bookings.some(
                      (booking) =>
                        booking.date === date && booking.slot === slot.slot
                    )
                      ? {
                          disabled: true,
                        }
                      : {
                          disabled: false,
                        })}
                    className="hidden"
                    type="radio"
                    value={slot.slot}
                    {...register("slot")}
                    id={`slot-${index}`}
                  />
                  {slot.slot}
                </Card>
              </Label>
            ))
          ) : (
            <div className="text-center p-4 bg-gray-100 rounded-md">
              No available time slots for this date
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-5 justify-center mt-5">
        <Button type="button" onClick={onBack} variant={"outline"}>
          Edit Questions?
        </Button>
        <Button>
          <Loader loading={loading}>Book Now</Loader>
        </Button>
      </div>
    </div>
  );
};

export default BookAppointmentDate;
