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
import { signIn, useSession } from "next-auth/react";
import { DepositPayment } from "./deposit-payment-form";

// Define the AppointmentTimeSlots interface
interface AppointmentTimeSlots {
  slot: string;
  available?: boolean;
  slotsRemaining?: number;
  startTime?: string;
  endTime?: string;
  duration?: number;
  formattedDuration?: string;
  isCustom?: boolean;
  maxSlots?: number;
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
  const { data: session, status } = useSession();
  const [isGuest, setIsGuest] = useState(false);
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: session?.user?.name || "",
      email: session?.user?.email || "",
    },
  });

  // Update form values when session changes
  useEffect(() => {
    if (session?.user) {
      form.setValue("name", session.user.name || "");
      form.setValue("email", session.user.email || "");
    }
  }, [session, form]);

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
      // Format the date in YYYY-MM-DD format to preserve the selected date regardless of timezone
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      const response = await fetch(`/api/bookings/available-slots?date=${formattedDate}&userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch available time slots');
      }
      const data = await response.json();
      
      // Process the slots to include formatted duration and calculate slots remaining
      const processedSlots = data.slots.map((slot: any) => {
        // Calculate end time if not provided
        const endTimeValue = slot.endTime || calculateEndTime(slot.slot, slot.duration);
        
        // Format duration for display (e.g., "30 mins")
        const formattedDuration = `${slot.duration} mins`;
        
        // Calculate slots remaining if maxSlots is provided
        const slotsRemaining = slot.maxSlots || 1;
        
        // Make sure to preserve the isCustom property exactly as it comes from the API
        return {
          ...slot,
          startTime: slot.startTime || slot.slot,
          endTime: endTimeValue,
          formattedDuration: formattedDuration,
          slotsRemaining: slotsRemaining,
          isCustom: Boolean(slot.isCustom) // Ensure isCustom is a boolean
        };
      });
      
      return processedSlots as AppointmentTimeSlots[];
    } catch (error) {
      console.error('Error fetching time slots:', error);
      throw error;
    }
  };

  // Helper function to calculate end time based on start time and duration
  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    
    let totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (selectedDate && session?.user?.id) {
      setIsLoading(true);
      fetchAvailableTimeSlots(selectedDate, session.user.id)
        .then((slots: AppointmentTimeSlots[]) => {
          console.log("Fetched time slots:", slots);
          console.log("Custom slots count:", slots.filter(slot => slot.isCustom).length);
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
          isAuthenticated: !!session,
          googleUserId: session?.user?.id || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsSubmitted(true);
        setDepositRequired(data.depositRequired);
        setRiskScore(data.riskScore);
        setBookingId(data.booking.id);

        if (data.depositRequired) {
          // Request deposit payment intent
          const depositResponse = await fetch('/api/bookings/deposit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              bookingId: data.booking.id,
              userId: userId,
            }),
          });

          if (depositResponse.ok) {
            const depositData = await depositResponse.json();
            setClientSecret(depositData.clientSecret);
          }
        }
      }
    } catch (error) {
      console.error("Error creating booking:", error);
    }
  };

  const handleDepositSuccess = () => {
    // Reset the form state after successful deposit payment
    setIsSubmitted(false);
    setDepositRequired(false);
    setClientSecret(null);
    setBookingId(null);
  };

  // Show authentication options if not authenticated and not guest
  if (status !== "loading" && !session && !isGuest) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-semibold text-center mb-4">Choose how to continue</h2>
        <p className="text-gray-600 text-center mb-6">
          Sign in with Google to manage your bookings later, or continue as a guest
        </p>
        <Button
          onClick={() => signIn('google')}
          className="w-full flex items-center justify-center space-x-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Sign in with Google</span>
        </Button>
        <div className="relative w-full text-center my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or</span>
          </div>
        </div>
        <Button
          onClick={() => setIsGuest(true)}
          variant="outline"
          className="w-full"
        >
          Continue as guest
        </Button>
      </div>
    );
  }

  if (isSubmitted && depositRequired && clientSecret && bookingId) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Deposit Required</h2>
          <p className="text-gray-600 mt-2">
            Due to previous cancellations, a deposit of $20 is required to confirm your booking.
          </p>
        </div>
        <DepositPayment
          clientSecret={clientSecret}
          bookingId={bookingId}
          onSuccess={handleDepositSuccess}
        />
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <CheckCircle className="w-16 h-16 text-green-500" />
        <h2 className="text-2xl font-semibold">Booking Confirmed!</h2>
        <p className="text-center">
          Thank you for booking your appointment. You will receive a confirmation email shortly.
          {session && "You can manage your booking anytime by signing into your Google account."}
          {!session && "To manage your booking in the future, please keep your confirmation email."}
        </p>
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
                        "justify-start text-left h-auto py-2 flex flex-col items-start",
                        field.value === slot.slot && "bg-royalPurple text-black",
                        slot.isCustom && "border-blue-400 border-2"
                      )}
                      onClick={() => {
                        handleTimeSlotClick(slot);
                      }}
                    >
                      <div className="font-medium">{slot.slot}</div>
                      {slot.startTime && slot.endTime && (
                        <div className="text-xs opacity-80">{slot.startTime} - {slot.endTime}</div>
                      )}
                      <div className="flex justify-between w-full text-xs mt-1">
                        {slot.formattedDuration && <span>{slot.formattedDuration}</span>}
                        {slot.slotsRemaining !== undefined && (
                          <span className="ml-auto">{slot.slotsRemaining} {slot.slotsRemaining === 1 ? 'slot' : 'slots'} left</span>
                        )}
                      </div>
                      {slot.isCustom && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded mt-1 font-medium">Custom Slot</span>
                      )}
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