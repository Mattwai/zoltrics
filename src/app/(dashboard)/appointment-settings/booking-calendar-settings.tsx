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
    "Monday": { startTime: "09:00", endTime: "17:00", duration: 30, maxBookings: 1 },
    "Tuesday": { startTime: "09:00", endTime: "17:00", duration: 30, maxBookings: 1 },
    "Wednesday": { startTime: "09:00", endTime: "17:00", duration: 30, maxBookings: 1 },
    "Thursday": { startTime: "09:00", endTime: "17:00", duration: 30, maxBookings: 1 },
    "Friday": { startTime: "09:00", endTime: "17:00", duration: 30, maxBookings: 1 },
    "Saturday": { startTime: "09:00", endTime: "13:00", duration: 30, maxBookings: 1 },
    "Sunday": { startTime: "09:00", endTime: "13:00", duration: 30, maxBookings: 1 },
  },
  "Extended Hours": {
    "Monday": { startTime: "08:00", endTime: "20:00", duration: 30, maxBookings: 1 },
    "Tuesday": { startTime: "08:00", endTime: "20:00", duration: 30, maxBookings: 1 },
    "Wednesday": { startTime: "08:00", endTime: "20:00", duration: 30, maxBookings: 1 },
    "Thursday": { startTime: "08:00", endTime: "20:00", duration: 30, maxBookings: 1 },
    "Friday": { startTime: "08:00", endTime: "20:00", duration: 30, maxBookings: 1 },
    "Saturday": { startTime: "09:00", endTime: "17:00", duration: 30, maxBookings: 1 },
    "Sunday": { startTime: "09:00", endTime: "17:00", duration: 30, maxBookings: 1 },
  },
  "Weekend Only": {
    "Monday": { startTime: "09:00", endTime: "17:00", duration: 30, maxBookings: 1 },
    "Tuesday": { startTime: "09:00", endTime: "17:00", duration: 30, maxBookings: 1 },
    "Wednesday": { startTime: "09:00", endTime: "17:00", duration: 30, maxBookings: 1 },
    "Thursday": { startTime: "09:00", endTime: "17:00", duration: 30, maxBookings: 1 },
    "Friday": { startTime: "09:00", endTime: "17:00", duration: 30, maxBookings: 1 },
    "Saturday": { startTime: "09:00", endTime: "20:00", duration: 30, maxBookings: 1 },
    "Sunday": { startTime: "09:00", endTime: "20:00", duration: 30, maxBookings: 1 },
  }
};

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

  const applyPreset = (preset: string) => {
    const presetHours = BUSINESS_HOURS_PRESETS[preset as keyof typeof BUSINESS_HOURS_PRESETS];
    setDayTimeSlots(presetHours);
    setAvailableDays(Object.keys(presetHours));
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
                <Card key={preset} className="cursor-pointer hover:border-blue-500 transition-colors"
                      onClick={() => applyPreset(preset)}>
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
                          handleDayToggle(day);
                          setActiveDay(day);
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
                            {dayTimeSlots[day]?.startTime} - {dayTimeSlots[day]?.endTime}
                            <br />
                            <span className="text-xs text-blue-500">
                              {dayTimeSlots[day]?.duration}min slots
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
                        value={dayTimeSlots[activeDay]?.startTime || "09:00"}
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
                        value={dayTimeSlots[activeDay]?.endTime || "17:00"}
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
                            <div>{dayTimeSlots[day]?.startTime}</div>
                            <div>to</div>
                            <div>{dayTimeSlots[day]?.endTime}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {dayTimeSlots[day]?.duration}min slots
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