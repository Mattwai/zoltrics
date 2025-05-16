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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { formatTimeSlot } from "@/lib/time-slots";

// Override the Booking type with complete definition
interface FullBooking {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  customer: {
    name: string;
    email: string;
    userId?: string;
    domain: {
      name: string;
    } | null;
  } | null;
  service: {
    id: string;
    name: string;
    pricing?: {
      price: number;
      currency: string;
    } | null;
  } | null;
  bookingMetadata: {
    notes: string | null;
  } | null;
  bookingPayment: {
    amount: number;
    currency: string;
    status: string;
  } | null;
}

// Extended service types to match the API response structure
interface ServicePricing {
  price: number;
  currency: string;
}

interface ServiceWithRelations {
  id: string;
  name: string;
  pricing?: ServicePricing | null;
}

// Extended booking type with the proper service structure
interface ExtendedBooking extends Omit<FullBooking, 'service'> {
  service: ServiceWithRelations | null;
}

interface BookingOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: FullBooking | null;
  onCancel: () => void;
  onBookingUpdate?: (updatedBooking: FullBooking) => void;
}

// Helper function to properly format dates from the API - using UTC to avoid timezone issues
const formatAPIDate = (dateString: string | Date): Date => {
  if (dateString instanceof Date) {
    // Create a new date to avoid timezone issues
    const d = new Date(dateString);
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0));
  }
  
  // For string dates, first parse as ISO, then create a new UTC date
  try {
    if (typeof dateString === 'string') {
      // Parse the date string to get components
      const d = parseISO(dateString);
      // Create a new date with UTC to preserve the date parts
      return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0));
    }
  } catch (e) {
    console.error("Error parsing date:", e);
  }
  
  // Fallback
  return new Date();
};

export const BookingOptionsDialog = ({
  isOpen,
  onClose,
  booking,
  onCancel,
  onBookingUpdate,
}: BookingOptionsDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    booking ? new Date(booking.startTime) : undefined
  );
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [originalNotes, setOriginalNotes] = useState<string>("");
  const [currentBooking, setCurrentBooking] = useState<ExtendedBooking | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const hasFetchedRef = useRef(false);
  const hasClosedDialogRef = useRef(false);
  const [availableServices, setAvailableServices] = useState<ServiceWithRelations[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [originalServiceId, setOriginalServiceId] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("pending");
  const [originalPaymentStatus, setOriginalPaymentStatus] = useState<string>("pending");

  // Reset fetch flag when dialog closes
  useEffect(() => {
    if (!isOpen) {
      hasFetchedRef.current = false;
      hasClosedDialogRef.current = true;
    } else {
      hasClosedDialogRef.current = false;
    }
  }, [isOpen]);

  console.log("Current date from booking:", booking?.startTime);

  // Fetch available services when dialog opens
  useEffect(() => {
    if (isOpen && booking?.userId) {
      const fetchServices = async () => {
        try {
          const response = await fetch(`/api/services?userId=${booking.userId}`);
          if (response.ok) {
            const data = await response.json();
            setAvailableServices(data.services || []);
          } else {
            console.error("Failed to fetch services");
          }
        } catch (error) {
          console.error("Error fetching services:", error);
        }
      };
      
      fetchServices();
    }
  }, [isOpen, booking?.userId]);

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
            console.log("Fetched booking data:", data);
            console.log("Payment info:", data.bookingPayment);
            
            setCurrentBooking(data);
            
            // Use the time from the actual booking, not local time
            const startTime = new Date(data.startTime);
            const endTime = new Date(data.endTime);
            setSelectedSlot(`${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`);
            
            const bookingNotes = data.bookingMetadata?.notes || "";
            setNotes(bookingNotes);
            setOriginalNotes(bookingNotes);
            setSelectedDate(new Date(data.startTime));
            
            // Set service and payment status
            if (data.service?.id) {
              setSelectedServiceId(data.service.id);
              setOriginalServiceId(data.service.id);
            }
            
            // Set default payment status explicitly and log it
            const statusValue = data.bookingPayment?.status || "pending";
            console.log("Setting payment status to:", statusValue);
            setPaymentStatus(statusValue);
            setOriginalPaymentStatus(statusValue);
            
            // Update parent component with fresh data
            if (onBookingUpdate) {
              onBookingUpdate(data);
            }
          } else {
            console.log("Fallback to props booking data:", booking);
            console.log("Props payment info:", booking.bookingPayment);
            
            // Fall back to the booking data passed by props
            setCurrentBooking(booking as ExtendedBooking);
            
            // Format time properly from the booking object
            const startTime = new Date(booking.startTime);
            const endTime = new Date(booking.endTime);
            setSelectedSlot(`${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`);
            
            const bookingNotes = booking.bookingMetadata?.notes || "";
            setNotes(bookingNotes);
            setOriginalNotes(bookingNotes);
            setSelectedDate(new Date(booking.startTime));
            
            // Set service and payment status from props
            if (booking.service?.id) {
              setSelectedServiceId(booking.service.id);
              setOriginalServiceId(booking.service.id);
            }
            
            // Set default payment status explicitly and log it
            const statusValue = booking.bookingPayment?.status || "pending";
            console.log("Setting payment status (fallback) to:", statusValue);
            setPaymentStatus(statusValue);
            setOriginalPaymentStatus(statusValue);
          }
        } catch (error) {
          console.error("Error fetching booking details:", error);
          console.log("Error fallback booking data:", booking);
          console.log("Error fallback payment info:", booking.bookingPayment);
          
          // Fall back to the booking data passed by props
          setCurrentBooking(booking as ExtendedBooking);
          
          // Format time properly from the booking object
          const startTime = new Date(booking.startTime);
          const endTime = new Date(booking.endTime);
          setSelectedSlot(`${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`);
          
          const bookingNotes = booking.bookingMetadata?.notes || "";
          setNotes(bookingNotes);
          setOriginalNotes(bookingNotes);
          setSelectedDate(new Date(booking.startTime));
          
          // Set service and payment status from props
          if (booking.service?.id) {
            setSelectedServiceId(booking.service.id);
            setOriginalServiceId(booking.service.id);
          }
          
          // Set default payment status explicitly and log it
          const statusValue = booking.bookingPayment?.status || "pending";
          console.log("Setting payment status (error fallback) to:", statusValue);
          setPaymentStatus(statusValue);
          setOriginalPaymentStatus(statusValue);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchBookingData();
    }
  }, [booking, isOpen, onBookingUpdate]);

  // Fetch available slots when date changes
  useEffect(() => {
    if (selectedDate) {
      const fetchAvailableSlots = async () => {
        try {
          setIsLoading(true);
          // Format date for API request
          const formattedDate = selectedDate.toISOString().split('T')[0];
          
          // If we have a current booking ID, exclude it from conflict checks
          const excludeParam = currentBooking?.id ? `&excludeBookingId=${currentBooking.id}` : '';
          const response = await fetch(`/api/appointments/available-slots?date=${formattedDate}${excludeParam}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log("Available slots from API:", data);
            
            // If we have a current booking for this date, make sure its slot is in the list
            if (currentBooking?.startTime && currentBooking?.endTime) {
              const startTime = new Date(currentBooking.startTime);
              const endTime = new Date(currentBooking.endTime);
              
              // Only add current booking slot if the selected date matches the booking date
              if (startTime.toDateString() === selectedDate.toDateString()) {
                const formattedBookingSlot = `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`;
                
                // Add the current booking slot to the available slots if not already included
                let updatedSlots = data.slots;
                if (!data.slots.includes(formattedBookingSlot)) {
                  updatedSlots = [formattedBookingSlot, ...data.slots];
                }
                
                setAvailableSlots(updatedSlots);
                
                // If we don't have a selected slot yet, select the booking's slot
                if (!selectedSlot) {
                  setSelectedSlot(formattedBookingSlot);
                } else if (!updatedSlots.includes(selectedSlot)) {
                  // If the previously selected slot is no longer available, default to the booking's slot
                  setSelectedSlot(formattedBookingSlot);
                }
              } else {
                setAvailableSlots(data.slots);
                // If we don't have a selected slot yet and have available slots, select the first one
                if ((!selectedSlot || !data.slots.includes(selectedSlot)) && data.slots.length > 0) {
                  setSelectedSlot(data.slots[0]);
                }
              }
            } else {
              setAvailableSlots(data.slots);
              // If we don't have a selected slot yet and have available slots, select the first one
              if ((!selectedSlot || !data.slots.includes(selectedSlot)) && data.slots.length > 0) {
                setSelectedSlot(data.slots[0]);
              } else if (selectedSlot && !data.slots.includes(selectedSlot) && data.slots.length > 0) {
                // If the previously selected slot is no longer available, default to the first available slot
                setSelectedSlot(data.slots[0]);
              }
            }
            
            // If this date is blocked, show an alert
            if (data.isBlocked) {
              toast.info("This date is blocked in your calendar. No slots available.");
            }
            
            // If there are no available slots
            if (data.slots.length === 0 && !data.isBlocked) {
              toast.info("No available time slots for this date.");
            }
            
          } else {
            console.error("Failed to fetch available slots:", await response.text());
            // If API fails, keep current slot only as fallback
            if (selectedSlot) {
              setAvailableSlots([selectedSlot]);
            } else if (currentBooking?.startTime && currentBooking?.endTime) {
              const startTime = new Date(currentBooking.startTime);
              const endTime = new Date(currentBooking.endTime);
              const formattedSlot = `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`;
              setAvailableSlots([formattedSlot]);
              setSelectedSlot(formattedSlot);
            } else {
              setAvailableSlots([]);
            }
          }
        } catch (error) {
          console.error("Error fetching available slots:", error);
          // If API fails, keep current slot only as fallback
          if (selectedSlot) {
            setAvailableSlots([selectedSlot]);
          } else if (currentBooking?.startTime && currentBooking?.endTime) {
            const startTime = new Date(currentBooking.startTime);
            const endTime = new Date(currentBooking.endTime);
            const formattedSlot = `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`;
            setAvailableSlots([formattedSlot]);
            setSelectedSlot(formattedSlot);
          } else {
            setAvailableSlots([]);
          }
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchAvailableSlots();
    } else {
      // Clear available slots if no date is selected
      setAvailableSlots([]);
      setSelectedSlot('');
    }
  }, [selectedDate, currentBooking?.id, currentBooking?.startTime, currentBooking?.endTime, selectedSlot]);

  // Handle date change manually since DatePicker manages its own state
  const handleDateChange = (date: Date | undefined) => {
    console.log("Date selected:", date);
    setSelectedDate(date);
  };

  // Define activeBooking before conditional return
  // Use currentBooking if available, otherwise use booking from props
  const activeBooking = currentBooking || (booking as ExtendedBooking);
  
  // For debugging: Log the active booking and payment status just before render
  useEffect(() => {
    if (activeBooking) {
      console.log("Active booking before render:", activeBooking);
      console.log("Payment status before render:", paymentStatus);
      console.log("Payment info before render:", activeBooking.bookingPayment);
    }
  }, [activeBooking, paymentStatus]);

  if (!booking) return null;

  const handleUpdateNotes = async () => {
    if (!activeBooking) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/appointments/${activeBooking.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          notes,
          startTime: activeBooking.startTime,
          endTime: activeBooking.endTime
        }),
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
        bookingMetadata: {
          ...activeBooking.bookingMetadata,
          notes: notes
        }
      });
      
      // Update original notes after successful save
      setOriginalNotes(notes);
      
      // Update the parent component with the new booking data including notes
      if (onBookingUpdate) {
        onBookingUpdate({
          ...activeBooking,
          bookingMetadata: {
            ...activeBooking.bookingMetadata,
            notes: notes
          }
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

  const handleUpdateService = async () => {
    if (!activeBooking) return;
    
    // Prevent service change if payment is completed
    if (activeBooking.bookingPayment?.status === "paid") {
      toast.error("Cannot change service for a paid booking");
      // Reset selected service to original
      setSelectedServiceId(originalServiceId);
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/appointments/${activeBooking.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          serviceId: selectedServiceId,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to update service");
      }

      // Get the updated booking data from the response
      const updatedBooking = await response.json();
      
      // Update current booking with the new data
      setCurrentBooking(updatedBooking);
      
      // Update original service ID after successful save
      setOriginalServiceId(selectedServiceId);
      
      // Update the parent component with the new booking data
      if (onBookingUpdate) {
        onBookingUpdate(updatedBooking);
      }
      
      toast.success("Service updated successfully");
    } catch (error) {
      console.error("Error updating service:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update service");
      // Reset selected service to original on error
      setSelectedServiceId(originalServiceId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePaymentStatus = async () => {
    if (!activeBooking) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/appointments/${activeBooking.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          paymentStatus: paymentStatus,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to update payment status");
      }

      // Get the updated booking data from the response
      const updatedBooking = await response.json();
      
      // Update current booking with the new data
      setCurrentBooking(updatedBooking);
      
      // Update original payment status after successful save
      setOriginalPaymentStatus(paymentStatus);
      
      // Update the parent component with the new booking data
      if (onBookingUpdate) {
        onBookingUpdate(updatedBooking);
      }
      
      toast.success("Payment status updated successfully");
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update payment status");
      // Reset payment status to original on error
      setPaymentStatus(originalPaymentStatus);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!activeBooking || !selectedDate || !selectedSlot) return;
    
    try {
      setIsLoading(true);
      const [startTime, endTime] = selectedSlot.split(" - ");
      const [startHours, startMinutes] = startTime.split(":").map(Number);
      const [endHours, endMinutes] = endTime.split(":").map(Number);
      
      const newStartTime = new Date(selectedDate);
      newStartTime.setHours(startHours, startMinutes, 0, 0);
      
      const newEndTime = new Date(selectedDate);
      newEndTime.setHours(endHours, endMinutes, 0, 0);

      const response = await fetch(`/api/appointments/${activeBooking.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          startTime: newStartTime instanceof Date ? newStartTime.toISOString() : newStartTime,
          endTime: newEndTime instanceof Date ? newEndTime.toISOString() : newEndTime,
          notes: activeBooking.bookingMetadata?.notes
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
        startTime: newStartTime,
        endTime: newEndTime
      });
      
      // Update the parent component with the new booking data
      if (onBookingUpdate) {
        onBookingUpdate({
          ...activeBooking,
          startTime: newStartTime,
          endTime: newEndTime
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
    // Store current booking data in case we need to restore it
    const bookingToPreserve = currentBooking || activeBooking;
    
    // If onBookingUpdate is available, make sure we update with the latest data
    // This ensures the booking details don't get lost when closing the dialog
    if (onBookingUpdate && bookingToPreserve) {
      // Clone the booking to avoid reference issues
      const bookingCopy = JSON.parse(JSON.stringify(bookingToPreserve));
      
      // Make sure the service information is preserved
      if (!bookingCopy.service && booking?.service) {
        bookingCopy.service = booking.service;
      }
      
      onBookingUpdate(bookingCopy as FullBooking);
    }
    
    // Close the dialog
    onClose();
  };

  // Format date for display with proper timezone handling
  const formatDisplayDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'MMMM d, yyyy');
  };
  
  // Format the price with currency
  const formatPrice = (service: ServiceWithRelations | null) => {
    if (!service || !service.pricing) return "None";
    const { price, currency = "NZD" } = service.pricing;
    return new Intl.NumberFormat('en-NZ', { 
      style: 'currency', 
      currency: currency 
    }).format(price);
  };
  
  // Check if service can be changed (only if payment is not completed)
  const canChangeService = activeBooking?.bookingPayment?.status !== "paid";

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Booking Options - {activeBooking?.customer?.name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Booking Details Section */}
          <div className="grid gap-2">
            <h3 className="text-sm font-medium text-gray-500">Booking Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-500">Name</Label>
                <p>{activeBooking?.customer?.name}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Email</Label>
                <p>{activeBooking?.customer?.email}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Date</Label>
                <p>{activeBooking?.startTime ? formatDisplayDate(activeBooking.startTime) : "Not set"}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Time</Label>
                <p>{selectedSlot}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Service</Label>
                <div className="mt-1">
                  <Select
                    key={`service-${selectedServiceId || 'none'}`}
                    value={selectedServiceId || undefined}
                    onValueChange={(value) => {
                      console.log("Service changed to:", value);
                      setSelectedServiceId(value);
                      if (value !== originalServiceId) {
                        // Auto-save service change if different
                        setTimeout(() => handleUpdateService(), 100);
                      }
                    }}
                    disabled={isLoading || !canChangeService}
                  >
                    <SelectTrigger className="w-full h-8 text-sm">
                      <SelectValue>
                        {activeBooking?.service?.name || "Select a service"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableServices.map((service) => (
                        <SelectItem key={service.id} value={service.id} className="text-sm">
                          {service.name} ({formatPrice(service)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!canChangeService && (
                    <p className="text-xs text-amber-600 mt-1">
                      Cannot change service for a paid booking
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Service Price</Label>
                <p>{formatPrice(activeBooking?.service)}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Payment Status</Label>
                <div className="mt-1">
                  <Select
                    key={`payment-status-${paymentStatus || 'pending'}`}
                    value={paymentStatus || 'pending'}
                    defaultValue="pending"
                    onValueChange={(value) => {
                      console.log("Payment status changed to:", value);
                      setPaymentStatus(value);
                      if (value !== originalPaymentStatus) {
                        // Auto-save payment status change if different
                        setTimeout(() => handleUpdatePaymentStatus(), 100);
                      }
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full h-8 text-sm">
                      <SelectValue>
                        {paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending" className="text-sm">Pending</SelectItem>
                      <SelectItem value="paid" className="text-sm">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                  initialDate={selectedDate}
                  disablePastDates={true}
                />
              </div>
              <div>
                <Label htmlFor="reschedule-slot">New Time Slot</Label>
                <Select value={selectedSlot} onValueChange={setSelectedSlot} disabled={isLoading || availableSlots.length === 0}>
                  <SelectTrigger className={cn(
                    "w-full h-8 text-sm",
                    availableSlots.length === 0 ? "text-gray-400" : ""
                  )}>
                    <SelectValue placeholder={availableSlots.length === 0 ? "No slots available" : "Select time slot"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto">
                    {availableSlots.length === 0 ? (
                      <div className="py-2 px-2 text-sm text-center text-gray-500">
                        No available time slots for this date
                      </div>
                    ) : (
                      availableSlots.map((slot) => (
                        <SelectItem key={slot} value={slot} className="text-sm">
                          {slot}
                        </SelectItem>
                      ))
                    )}
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
                onClick={handleDialogClose}
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
                  availableSlots.length === 0 ||
                  (selectedDate && 
                    new Date(activeBooking?.startTime || "").toDateString() === selectedDate.toDateString() &&
                    selectedSlot === `${format(new Date(activeBooking?.startTime || ""), 'HH:mm')} - ${format(new Date(activeBooking?.endTime || ""), 'HH:mm')}`)
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