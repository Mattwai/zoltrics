"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader } from "@/components/loader";
import Section from "@/components/section-label";
import { generateTimeSlots, calculateDuration, generateTimeOptions } from "@/lib/time-slots";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Calendar, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parse } from 'date-fns';

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

const BUSINESS_HOURS_PRESETS = {
  "Standard Business": {
    "Monday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
    "Tuesday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
    "Wednesday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
    "Thursday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
    "Friday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
    "Saturday": { startTime: "9:00 AM", endTime: "1:00 PM", duration: 30, maxBookings: 1 },
    "Sunday": { startTime: "9:00 AM", endTime: "1:00 PM", duration: 30, maxBookings: 1 },
  },
  "Extended Hours": {
    "Monday": { startTime: "8:00 AM", endTime: "8:00 PM", duration: 30, maxBookings: 1 },
    "Tuesday": { startTime: "8:00 AM", endTime: "8:00 PM", duration: 30, maxBookings: 1 },
    "Wednesday": { startTime: "8:00 AM", endTime: "8:00 PM", duration: 30, maxBookings: 1 },
    "Thursday": { startTime: "8:00 AM", endTime: "8:00 PM", duration: 30, maxBookings: 1 },
    "Friday": { startTime: "8:00 AM", endTime: "8:00 PM", duration: 30, maxBookings: 1 },
    "Saturday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
    "Sunday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
  },
  "Weekend Only": {
    "Monday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
    "Tuesday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
    "Wednesday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
    "Thursday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
    "Friday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
    "Saturday": { startTime: "9:00 AM", endTime: "8:00 PM", duration: 30, maxBookings: 1 },
    "Sunday": { startTime: "9:00 AM", endTime: "8:00 PM", duration: 30, maxBookings: 1 },
  }
};

// Utility function to convert 24h time to 12h format
const convertTo12HourFormat = (time24h: string) => {
  if (!time24h) return "12:00 AM";
  try {
    const [hours, minutes] = time24h.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return format(date, 'h:mm a'); // Format as "1:30 PM"
  } catch (e) {
    console.error("Error converting time:", e);
    return time24h;
  }
};

// Utility function to convert 12h time to 24h format
const convertTo24HourFormat = (time12h: string) => {
  if (!time12h) return "00:00";
  try {
    const date = parse(time12h, 'h:mm a', new Date());
    return format(date, 'HH:mm'); // Format as "13:30"
  } catch (e) {
    console.error("Error converting time:", e);
    return time12h;
  }
};

export const BookingCalendarSettings = ({ userId }: BookingCalendarSettingsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [dayTimeSlots, setDayTimeSlots] = useState<Record<string, TimeSlot>>({
    "Monday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
    "Tuesday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
    "Wednesday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
    "Thursday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
    "Friday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
    "Saturday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
    "Sunday": { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 },
  });
  const [activeDay, setActiveDay] = useState<string>("Monday");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  // Add function to check if current schedule matches a preset
  const checkMatchingPreset = (slots: Record<string, TimeSlot>, days: string[]) => {
    for (const [presetName, presetHours] of Object.entries(BUSINESS_HOURS_PRESETS)) {
      const presetDays = Object.keys(presetHours);
      
      // Check if days match
      if (days.length !== presetDays.length || 
          !days.every(day => presetDays.includes(day))) {
        continue;
      }

      // Check if time slots match for each day
      const isMatching = days.every(day => {
        const currentSlot = slots[day];
        const presetSlot = presetHours[day as keyof typeof presetHours];
        return (
          currentSlot.startTime === presetSlot.startTime &&
          currentSlot.endTime === presetSlot.endTime &&
          currentSlot.duration === presetSlot.duration &&
          currentSlot.maxBookings === presetSlot.maxBookings
        );
      });

      if (isMatching) {
        return presetName;
      }
    }
    return null;
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/user/booking-calendar");
        if (!response.ok) throw new Error("Failed to fetch settings");
        
        const data = await response.json();
        if (data) {
          // Parse the timeZone field which contains the time slots
          if (data.timeZone) {
            try {
              const parsedData = JSON.parse(data.timeZone);
              
              // Check if the settings use the new format with dayTimeSlots and availableDays
              if (parsedData.dayTimeSlots && parsedData.availableDays) {
                // Use the new format data
                setDayTimeSlots(parsedData.dayTimeSlots);
                setAvailableDays(parsedData.availableDays);
                
                // Check if the loaded schedule matches any preset
                const matchingPreset = checkMatchingPreset(parsedData.dayTimeSlots, parsedData.availableDays);
                setSelectedPreset(matchingPreset);
              } 
              // If it's the old format with just day-indexed timeSlots
              else {
                // Convert old format (indexed by day number) to named days
                const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                
                const loadedTimeSlots: Record<string, TimeSlot> = {};
                const enabledDays: string[] = [];
                
                // Map through the available days (0-6) and convert them to named days
                Object.entries(parsedData).forEach(([dayIndex, slots]) => {
                  const dayName = dayMap[parseInt(dayIndex)];
                  
                  // Only process if there are slots for this day
                  if (Array.isArray(slots) && slots.length > 0) {
                    // Mark the day as available
                    enabledDays.push(dayName);
                    
                    // Find the first and last slot to determine business hours
                    const firstSlot = slots[0] as any;
                    const lastSlot = slots[slots.length - 1] as any;
                    
                    // Set the day's time slot with the first and last times
                    loadedTimeSlots[dayName] = {
                      startTime: firstSlot.startTime.includes('AM') || firstSlot.startTime.includes('PM') ? 
                        firstSlot.startTime : 
                        convertTo12HourFormat(firstSlot.startTime),
                      endTime: lastSlot.endTime.includes('AM') || lastSlot.endTime.includes('PM') ? 
                        lastSlot.endTime : 
                        convertTo12HourFormat(lastSlot.endTime),
                      duration: firstSlot.duration || 30,
                      maxBookings: firstSlot.maxBookings || 1
                    };
                  }
                });
                
                if (Object.keys(loadedTimeSlots).length > 0) {
                  setDayTimeSlots(loadedTimeSlots);
                  setAvailableDays(enabledDays);
                  
                  // Check if the loaded schedule matches any preset
                  const matchingPreset = checkMatchingPreset(loadedTimeSlots, enabledDays);
                  setSelectedPreset(matchingPreset);
                }
              }
            } catch (error) {
              console.error("Error parsing time slots:", error);
              toast({
                title: "Error",
                description: "Failed to parse booking calendar settings",
                variant: "destructive",
              });
            }
          }
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
    
    // Ensure the day has proper time slot configuration
    if (!dayTimeSlots[day]) {
      setDayTimeSlots(prev => ({
        ...prev,
        [day]: { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 }
      }));
    }
  };

  const handleTimeSlotChange = (day: string, field: keyof TimeSlot, value: string | number) => {
    setDayTimeSlots(prev => {
      const updated = { 
        ...prev,
        [day]: { ...prev[day], [field]: value }
      };
      
      // Only update time validations if start or end time changed
      if (field === "startTime" || field === "endTime") {
        const slot = updated[day];
        
        // Convert from 12h to 24h format for calculation if needed
        const startTime24h = slot.startTime.includes('M') ? convertTo24HourFormat(slot.startTime) : slot.startTime;
        const endTime24h = slot.endTime.includes('M') ? convertTo24HourFormat(slot.endTime) : slot.endTime;
        
        // Validate start time is before end time
        const startParts = startTime24h.split(':').map(Number);
        const endParts = endTime24h.split(':').map(Number);
        const startMinutes = startParts[0] * 60 + startParts[1];
        const endMinutes = endParts[0] * 60 + endParts[1];
        
        if (startMinutes >= endMinutes) {
          // Reset to valid value and show toast
          if (field === "startTime") {
            updated[day].startTime = prev[day].startTime;
            toast({
              title: "Invalid Time",
              description: "Start time must be before end time",
              variant: "destructive",
            });
          } else {
            updated[day].endTime = prev[day].endTime;
            toast({
              title: "Invalid Time",
              description: "End time must be after start time",
              variant: "destructive",
            });
          }
        }
        // Don't recalculate duration when changing start/end times
        // This keeps the user-selected duration value
      }
      
      return updated;
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Store the day-based time slots as is, preserving the AM/PM format
      // This will be used for displaying in the settings
      const payload = {
        availableDays,
        // Include the full dayTimeSlots object with all day settings
        dayTimeSlots,
        // For backward compatibility, also include the day-indexed format
        timeSlots: DAYS_OF_WEEK.reduce((acc, day, index) => {
          // Only include available days
          if (availableDays.includes(day)) {
            // Convert the time to 24-hour format for the API
            const daySlot = dayTimeSlots[day];
            const startTime24h = daySlot.startTime.includes('M') ? 
              convertTo24HourFormat(daySlot.startTime) : 
              daySlot.startTime;
            const endTime24h = daySlot.endTime.includes('M') ? 
              convertTo24HourFormat(daySlot.endTime) : 
              daySlot.endTime;
            
            // Generate slots based on the settings
            acc[index] = generateTimeSlots(
              startTime24h,
              endTime24h,
              daySlot.duration,
              daySlot.maxBookings
            );
          } else {
            acc[index] = [];
          }
          return acc;
        }, {} as Record<number, any[]>),
        startDate,
      };
      
      const response = await fetch("/api/user/booking-calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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

  const applyPreset = (preset: string) => {
    const presetHours = BUSINESS_HOURS_PRESETS[preset as keyof typeof BUSINESS_HOURS_PRESETS];
    setDayTimeSlots(presetHours);
    setAvailableDays(Object.keys(presetHours));
    setSelectedPreset(preset);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
      <div className="lg:col-span-1">
        <Section
          label="Booking Calendar"
          message="Set up your weekly schedule to let customers know when they can book appointments with you."
        />
      </div>
      <div className="lg:col-span-4 space-y-6">
        <div className="p-4 bg-blue-50 rounded-md mb-6">
          <p className="text-sm text-blue-800">
            <strong>Quick Start:</strong> Choose a preset schedule or customise your own availability.
            Your settings will determine when customers can book appointments with you.
          </p>
        </div>

        <Tabs defaultValue="presets" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="presets">Preset Schedules</TabsTrigger>
            <TabsTrigger value="custom">Custom Schedule</TabsTrigger>
          </TabsList>
          
          <TabsContent value="presets" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.keys(BUSINESS_HOURS_PRESETS).map((preset) => (
                <Card 
                  key={preset} 
                  className={cn(
                    "cursor-pointer transition-all duration-200",
                    selectedPreset === preset 
                      ? "border-blue-500 bg-blue-50 shadow-md" 
                      : "hover:border-blue-500 hover:bg-blue-50/50"
                  )}
                  onClick={() => applyPreset(preset)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{preset}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {Object.entries(BUSINESS_HOURS_PRESETS[preset as keyof typeof BUSINESS_HOURS_PRESETS]).map(([day, hours]) => (
                        <div key={day} className="flex justify-between">
                          <span>{day.slice(0, 3)}</span>
                          <span>{hours.startTime} - {hours.endTime}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Available Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {DAYS_OF_WEEK.map((day) => (
                      <div 
                        key={day} 
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          availableDays.includes(day) 
                            ? 'border-blue-200 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        } ${
                          activeDay === day 
                            ? 'ring-2 ring-blue-500' 
                            : ''
                        }`}
                        onClick={() => {
                          // Always set active day first
                          setActiveDay(day);
                          
                          // Ensure the day has default time slots if not already set
                          if (!dayTimeSlots[day]) {
                            setDayTimeSlots(prev => ({
                              ...prev,
                              [day]: { startTime: "9:00 AM", endTime: "5:00 PM", duration: 30, maxBookings: 1 }
                            }));
                          }
                          
                          // Then toggle availability
                          handleDayToggle(day);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <Label 
                            htmlFor={day} 
                            className={`font-medium cursor-pointer ${
                              availableDays.includes(day) ? 'text-blue-700' : 'text-gray-700'
                            }`}
                          >
                            {day}
                          </Label>
                          <input
                            type="checkbox"
                            id={day}
                            checked={availableDays.includes(day)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleDayToggle(day);
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </div>
                        {availableDays.includes(day) && (
                          <div className="mt-2 text-sm text-blue-600">
                            {dayTimeSlots[day]?.startTime.includes(':') && !dayTimeSlots[day]?.startTime.includes('M') ? 
                              convertTo12HourFormat(dayTimeSlots[day]?.startTime) : 
                              dayTimeSlots[day]?.startTime || "9:00 AM"} - 
                            {dayTimeSlots[day]?.endTime.includes(':') && !dayTimeSlots[day]?.endTime.includes('M') ? 
                              convertTo12HourFormat(dayTimeSlots[day]?.endTime) : 
                              dayTimeSlots[day]?.endTime || "5:00 PM"}
                            <br />
                            <span className="text-xs text-blue-500">
                              {dayTimeSlots[day]?.duration || 30}min slots
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {activeDay} Settings
                    {!availableDays.includes(activeDay) && (
                      <span className="text-sm text-muted-foreground ml-2">
                        (Enable this day to set hours)
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`startTime-${activeDay}`}>Start Time</Label>
                      <select
                        id={`startTime-${activeDay}`}
                        value={dayTimeSlots[activeDay]?.startTime.includes(':') && !dayTimeSlots[activeDay]?.startTime.includes('M') ? 
                              convertTo12HourFormat(dayTimeSlots[activeDay]?.startTime) : 
                              dayTimeSlots[activeDay]?.startTime || "9:00 AM"}
                        onChange={(e) => handleTimeSlotChange(activeDay, "startTime", e.target.value)}
                        disabled={!availableDays.includes(activeDay)}
                        className="w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 pl-2"
                      >
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor={`endTime-${activeDay}`}>End Time</Label>
                      <select
                        id={`endTime-${activeDay}`}
                        value={dayTimeSlots[activeDay]?.endTime.includes(':') && !dayTimeSlots[activeDay]?.endTime.includes('M') ? 
                              convertTo12HourFormat(dayTimeSlots[activeDay]?.endTime) : 
                              dayTimeSlots[activeDay]?.endTime || "5:00 PM"}
                        onChange={(e) => handleTimeSlotChange(activeDay, "endTime", e.target.value)}
                        disabled={!availableDays.includes(activeDay)}
                        className="w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 pl-2"
                      >
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor={`duration-${activeDay}`}>Appointment Duration</Label>
                      <select
                        id={`duration-${activeDay}`}
                        value={dayTimeSlots[activeDay]?.duration || 30}
                        onChange={(e) => handleTimeSlotChange(activeDay, "duration", parseInt(e.target.value))}
                        disabled={!availableDays.includes(activeDay)}
                        className="w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 pl-2"
                      >
                        {[15, 30, 45, 60, 90, 120].map(duration => (
                          <option key={duration} value={duration}>{duration} minutes</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor={`maxBookings-${activeDay}`}>Maximum Concurrent Bookings</Label>
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
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Schedule Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day} className="text-center">
                      <div className={`p-2 rounded-t-md ${availableDays.includes(day) ? 'bg-blue-50' : 'bg-gray-50'}`}>
                        <span className="font-medium">{day.slice(0, 3)}</span>
                      </div>
                      <div className={`p-2 rounded-b-md border ${availableDays.includes(day) ? 'border-blue-200' : 'border-gray-200'}`}>
                        {availableDays.includes(day) ? (
                          <div className="text-sm">
                            <div>{dayTimeSlots[day]?.startTime || "9:00 AM"}</div>
                            <div>to</div>
                            <div>{dayTimeSlots[day]?.endTime || "5:00 PM"}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {dayTimeSlots[day]?.duration || 30}min slots
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">Unavailable</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Button onClick={handleSave} className="w-full">
          <Loader loading={loading}>Save Schedule</Loader>
        </Button>
      </div>
    </div>
  );
};