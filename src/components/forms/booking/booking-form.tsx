"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useSession } from "next-auth/react";

// Define the AppointmentTimeSlots interface
interface AppointmentTimeSlots {
  slot: string;
  available?: boolean;
}

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  date: z.date({
    required_error: "Please select a date",
  }),
  time: z.string().min(1, "Please select a time"),
});

type BookingFormProps = {
  userId: string;
};

const BookingForm = ({ userId }: BookingFormProps) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [depositRequired, setDepositRequired] = useState<boolean>(false);
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<AppointmentTimeSlots[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const handleDateChange = async (date: Date | undefined) => {
    if (date && session?.user?.id) {
      setIsLoading(true);
      try {
        const slots = await fetchAvailableTimeSlots(date, session.user.id);
        setAvailableTimeSlots(slots);
        if (selectedTime && !slots.some(slot => slot.slot === selectedTime)) {
          setSelectedTime(null);
          form.setValue('time', '');
        }
        setError(null);
        
        // If no slots available for this date, add it to disabled dates
        if (slots.length === 0) {
          setDisabledDates(prev => [...prev, date]);
        }
      } catch (err) {
        console.error('Error fetching time slots:', err);
        setError('Failed to load available time slots');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const fetchAvailableTimeSlots = async (date: Date, userId: string) => {
    try {
      const response = await fetch(`/api/bookings/available-slots?date=${date.toISOString()}&userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch available time slots');
      }
      const data = await response.json();
      return data.slots as AppointmentTimeSlots[];
    } catch (error) {
      console.error('Error fetching time slots:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (selectedDate && session?.user?.id) {
      setIsLoading(true);
      fetchAvailableTimeSlots(selectedDate, session.user.id)
        .then((slots: AppointmentTimeSlots[]) => {
          setAvailableTimeSlots(slots);
          setError(null);
        })
        .catch(err => {
          console.error('Error fetching time slots:', err);
          setError('Failed to load available time slots');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setAvailableTimeSlots([]);
    }
  }, [selectedDate, session?.user?.id]);

  const handleTimeSlotClick = (slot: AppointmentTimeSlots) => {
    setSelectedTime(slot.slot);
    form.setValue("time", slot.slot);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          date: values.date,
          slot: values.time,
          userId: userId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsSubmitted(true);
        setDepositRequired(data.depositRequired);
        setRiskScore(data.riskScore);
      } else {
        console.error("Error creating booking:", await response.text());
      }
    } catch (error) {
      console.error("Error creating booking:", error);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <CheckCircle className="w-16 h-16 text-green-500" />
        <h2 className="text-2xl font-semibold">Booking Confirmed!</h2>
        <p className="text-center">
          Thank you for booking your appointment. You will receive a confirmation email shortly.
        </p>
        {depositRequired && (
          <p className="text-center text-red-500">
            Due to previous cancellations for this session, a deposit is required to confirm your booking.
          </p>
        )}
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={async (date) => {
                      field.onChange(date);
                      await handleDateChange(date);
                    }}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                      date > new Date(new Date().setMonth(new Date().getMonth() + 3)) ||
                      disabledDates.some(
                        (disabledDate) =>
                          disabledDate.getFullYear() === date.getFullYear() &&
                          disabledDate.getMonth() === date.getMonth() &&
                          disabledDate.getDate() === date.getDate()
                      )
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time</FormLabel>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-[200px] overflow-y-auto">
                {isLoading ? (
                  <div className="col-span-2 text-center py-4">Loading available time slots...</div>
                ) : availableTimeSlots.length > 0 ? (
                  availableTimeSlots.map((slot, index) => (
                    <Button
                      type="button"
                      key={index}
                      variant={field.value === slot.slot ? "default" : "outline"}
                      className={cn(
                        "justify-start text-left h-12",
                        field.value === slot.slot && "bg-grandis text-black"
                      )}
                      onClick={() => {
                        handleTimeSlotClick(slot);
                      }}
                    >
                      {slot.slot}
                    </Button>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-4 text-gray-500">
                    No available time slots for this date
                  </div>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full mt-6">
          Book Appointment
        </Button>
      </form>
    </Form>
  );
};

export default BookingForm; 