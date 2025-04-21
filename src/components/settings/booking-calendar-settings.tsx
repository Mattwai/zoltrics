"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader } from "@/components/loader";
import Section from "@/components/section-label";
import { generateTimeSlots, calculateDuration, generateTimeOptions } from "@/lib/time-slots";

interface TimeSlot {
  startTime: string;
  endTime: string;
  duration: number;
  maxBookings: number;
}

interface BookingCalendarSettingsProps {
  userId: string;
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// Use the utility function to generate time options
const TIME_OPTIONS = generateTimeOptions();

export const BookingCalendarSettings = ({ userId }: BookingCalendarSettingsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [dayTimeSlots, setDayTimeSlots] = useState<Record<string, TimeSlot>>({
    "Monday": { startTime: "09:00", endTime: "17:00", duration: 30, maxBookings: 1 },
    "Tuesday": { startTime: "09:00", endTime: "17:00", duration: 30, maxBookings: 1 },
    "Wednesday": { startTime: "09:00", endTime: "17:00", duration: 30, maxBookings: 1 },
    "Thursday": { startTime: "09:00", endTime: "17:00", duration: 30, maxBookings: 1 },
    "Friday": { startTime: "09:00", endTime: "17:00", duration: 30, maxBookings: 1 },
    "Saturday": { startTime: "09:00", endTime: "17:00", duration: 30, maxBookings: 1 },
    "Sunday": { startTime: "09:00", endTime: "17:00", duration: 30, maxBookings: 1 },
  });
  const [activeDay, setActiveDay] = useState<string>("Monday");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/user/booking-calendar");
        if (!response.ok) throw new Error("Failed to fetch settings");
        
        const data = await response.json();
        if (data) {
          setAvailableDays(data.availableDays || []);

          // Load time slots for each day
          if (data.timeSlots) {
            try {
              const timeSlots = JSON.parse(data.timeSlots);
              const dayMap = {
                0: "Sunday",
                1: "Monday",
                2: "Tuesday",
                3: "Wednesday",
                4: "Thursday",
                5: "Friday",
                6: "Saturday",
              };

              // Create a new object for day time slots
              const newDayTimeSlots = { ...dayTimeSlots };
              
              // For each day, use the first time slot if available
              Object.entries(dayMap).forEach(([dayIndex, dayName]) => {
                const daySlots = timeSlots[dayIndex];
                if (daySlots && daySlots.length > 0) {
                  newDayTimeSlots[dayName] = daySlots[0];
                }
              });

              setDayTimeSlots(newDayTimeSlots);
            } catch (error) {
              console.error("Error parsing time slots:", error);
            }
          }
          
          setStartDate(new Date(data.startDate).toISOString().split("T")[0]);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast({
          title: "Error",
          description: "Failed to load booking calendar settings",
          variant: "destructive",
        });
      }
    };

    fetchSettings();
  }, [toast]);

  const handleDayToggle = (day: string) => {
    setAvailableDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
    
    // When a day is selected, make it the active day for editing
    if (!availableDays.includes(day)) {
      setActiveDay(day);
    }
  };

  const handleTimeSlotChange = (day: string, field: keyof TimeSlot, value: string | number) => {
    setDayTimeSlots(prev => {
      const updated = { 
        ...prev,
        [day]: { ...prev[day], [field]: value }
      };
      
      // If start or end time changed, recalculate duration
      if (field === "startTime" || field === "endTime") {
        const slot = updated[day];
        updated[day].duration = calculateDuration(slot.startTime, slot.endTime);
      }
      
      return updated;
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Convert day-based time slots to day index-based format for API
      const dayMap = {
        "Sunday": 0,
        "Monday": 1,
        "Tuesday": 2,
        "Wednesday": 3,
        "Thursday": 4,
        "Friday": 5,
        "Saturday": 6,
      };
      
      const timeSlots: Record<number, any[]> = {};
      
      // For each day, generate individual time slots if the day is selected
      Object.entries(dayMap).forEach(([day, index]) => {
        if (availableDays.includes(day)) {
          const daySlot = dayTimeSlots[day];
          // Generate multiple time slots based on the duration
          const generatedSlots = generateTimeSlots(
            daySlot.startTime, 
            daySlot.endTime, 
            daySlot.duration, 
            daySlot.maxBookings
          );
          timeSlots[index] = generatedSlots;
        } else {
          timeSlots[index] = [];
        }
      });
      
      const response = await fetch("/api/user/booking-calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          availableDays,
          timeSlots,
          startDate,
        }),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      toast({
        title: "Success",
        description: "Booking calendar settings updated successfully",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to update booking calendar settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
      <div className="lg:col-span-1">
        <Section
          label="Booking Calendar"
          message="Customize your availability and booking preferences. These settings determine when customers can book appointments with you."
        />
      </div>
      <div className="lg:col-span-4 space-y-6">
        <div className="p-4 bg-blue-50 rounded-md mb-6">
          <p className="text-sm text-blue-800">
            <strong>Important:</strong> By default, no time slots are available for booking.
            Use this page to set your weekly schedule by selecting available days and adding time slots.
            For date-specific overrides, use the Custom Time Slots page.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">Available Days</h3>
          <div className="flex flex-wrap gap-4">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={day}
                  checked={availableDays.includes(day)}
                  onChange={() => handleDayToggle(day)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <Label htmlFor={day}>{day}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          
          <div className="border rounded-md p-4">
            <h4 className="font-medium mb-4">
              <b>{activeDay}</b> Settings
              {!availableDays.includes(activeDay) && 
                <span className="text-sm text-muted-foreground ml-2">(Disabled - check the box above to enable)</span>
              }
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor={`startTime-${activeDay}`} className="text-sm text-gray-500">Start Time</Label>
                <select
                  id={`startTime-${activeDay}`}
                  value={dayTimeSlots[activeDay]?.startTime || "09:00"}
                  onChange={(e) => handleTimeSlotChange(activeDay, "startTime", e.target.value)}
                  disabled={!availableDays.includes(activeDay)}
                  className="w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 pl-2"
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor={`endTime-${activeDay}`} className="text-sm text-gray-500">End Time</Label>
                <select
                  id={`endTime-${activeDay}`}
                  value={dayTimeSlots[activeDay]?.endTime || "17:00"}
                  onChange={(e) => handleTimeSlotChange(activeDay, "endTime", e.target.value)}
                  disabled={!availableDays.includes(activeDay)}
                  className="w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 pl-2"
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor={`duration-${activeDay}`} className="text-sm text-gray-500">Appointment Duration (min)</Label>
                <select
                  id={`duration-${activeDay}`}
                  value={dayTimeSlots[activeDay]?.duration || 30}
                  onChange={(e) => handleTimeSlotChange(activeDay, "duration", parseInt(e.target.value))}
                  disabled={!availableDays.includes(activeDay)}
                  className="w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 pl-2"
                >
                  {[15, 30, 45, 60, 90, 120].map(duration => (
                    <option key={duration} value={duration}>
                      {duration}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor={`maxBookings-${activeDay}`} className="text-sm text-gray-500">Max Concurrent Bookings</Label>
                <Input
                  id={`maxBookings-${activeDay}`}
                  type="number"
                  min="1"
                  value={dayTimeSlots[activeDay]?.maxBookings || 1}
                  onChange={(e) => handleTimeSlotChange(activeDay, "maxBookings", parseInt(e.target.value))}
                  disabled={!availableDays.includes(activeDay)}
                  className="w-full mt-1"
                />
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded border text-sm text-gray-600">
              <p>On {activeDay}s, appointments will last {dayTimeSlots[activeDay]?.duration || 30} minutes between {dayTimeSlots[activeDay]?.startTime || "09:00"} and {dayTimeSlots[activeDay]?.endTime || "17:00"}.</p>
              <p>You can accept up to {dayTimeSlots[activeDay]?.maxBookings || 1} concurrent booking(s) per time slot.</p>
              <p className="mt-2 text-blue-600">This will generate {Math.floor(calculateDuration(dayTimeSlots[activeDay]?.startTime || "09:00", dayTimeSlots[activeDay]?.endTime || "17:00") / (dayTimeSlots[activeDay]?.duration || 30))} individual {dayTimeSlots[activeDay]?.duration || 30}-minute slots.</p>
              <p className="mt-2 text-violet-700">Your settings will create individual appointment slots at {dayTimeSlots[activeDay]?.duration || 30}-minute intervals (e.g., 9:00, 9:30, 10:00, etc.).</p>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          <Loader loading={loading}>Save Settings</Loader>
        </Button>
      </div>
    </div>
  );}