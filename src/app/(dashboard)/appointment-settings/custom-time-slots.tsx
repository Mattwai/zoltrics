"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader } from "@/components/loader";
import Section from "@/components/section-label";
import { Calendar } from "@/components/ui/calendar";
import { format, isAfter, isBefore, startOfDay, addMinutes, parse, isToday, isSameDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { generateTimeOptions, calculateDuration, calculateEndTime, formatTimeSlot } from "@/lib/time-slots";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Clock, Calendar as CalendarIcon, X } from "lucide-react";

// Utility functions for time conversion
const convertTo24HourFormat = (time12h: string): string => {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  
  if (hours === '12') {
    hours = modifier === 'AM' ? '00' : '12';
  } else if (modifier === 'PM') {
    hours = (parseInt(hours, 10) + 12).toString();
  }
  
  return `${hours.padStart(2, '0')}:${minutes}`;
};

const convertTo12HourFormat = (time24h: string): string => {
  const [hours, minutes] = time24h.split(':');
  const hour = parseInt(hours, 10);
  
  if (hour === 0) {
    return `12:${minutes} AM`;
  } else if (hour < 12) {
    return `${hour}:${minutes} AM`;
  } else if (hour === 12) {
    return `12:${minutes} PM`;
  } else {
    return `${hour - 12}:${minutes} PM`;
  }
};

interface TimeSlot {
  id?: string;
  startTime: string;
  endTime: string;
  duration: number;
  maxSlots: number;
  isCustom?: boolean;
  overrideRegular?: boolean;
  slot?: string;
}

interface CustomTimeSlotsProps {
  userId: string;
}

// Use the utility function to generate time options
const TIME_OPTIONS = generateTimeOptions();
const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

export const CustomTimeSlots = ({ userId }: CustomTimeSlotsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [customSlots, setCustomSlots] = useState<TimeSlot[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [newSlot, setNewSlot] = useState<TimeSlot>({
    startTime: "09:00",
    endTime: "09:30",
    duration: 30,
    maxSlots: 1
  });

  const fetchTimeSlots = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bookings/custom-slots?date=${date}&userId=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch time slots");
      
      const data = await response.json();
      console.log("Fetched data:", data); // Add logging to debug
      
      // Ensure slots are properly formatted with all required fields
      const formattedCustomSlots = (data.customSlots || []).map((slot: any) => ({
        ...slot,
        // Ensure endTime exists or calculate it
        endTime: slot.endTime || calculateEndTime(slot.startTime, slot.duration),
        // Make sure duration and maxSlots are numbers
        duration: parseInt(slot.duration) || 30,
        maxSlots: parseInt(slot.maxSlots) || 1
      }));
      
      setAvailableSlots(data.slots || []);
      setCustomSlots(formattedCustomSlots);
      setIsBlocked(data.isBlocked || false);
    } catch (error) {
      console.error("Error fetching time slots:", error);
      toast({
        title: "Error",
        description: "Failed to load time slots",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots(format(selectedDate, "yyyy-MM-dd"));
    }
  }, [selectedDate, fetchTimeSlots]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      // Reset blocked state when changing dates
      setIsBlocked(false);
    }
  };

  const handleBlockDate = async () => {
    if (!selectedDate) return;
    
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    setLoading(true);
    try {
      const response = await fetch("/api/bookings/custom-slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: formattedDate,
          slots: [],
          userId,
          isBlocked: true
        }),
      });

      if (!response.ok) throw new Error("Failed to block date");
      
      toast({
        title: "Success",
        description: "Date blocked successfully",
      });
      
      fetchTimeSlots(formattedDate);
      setIsBlocked(true);
    } catch (error) {
      console.error("Error blocking date:", error);
      toast({
        title: "Error",
        description: "Failed to block date",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockDate = async () => {
    if (!selectedDate) return;
    
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    setLoading(true);
    try {
      const response = await fetch("/api/bookings/custom-slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: formattedDate,
          slots: [],
          userId,
          isBlocked: false
        }),
      });

      if (!response.ok) throw new Error("Failed to unblock date");
      
      toast({
        title: "Success",
        description: "Date unblocked successfully",
      });
      
      fetchTimeSlots(formattedDate);
      setIsBlocked(false);
    } catch (error) {
      console.error("Error unblocking date:", error);
      toast({
        title: "Error",
        description: "Failed to unblock date",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = () => {
    setNewSlot({
      startTime: "09:00",
      endTime: calculateEndTime("09:00", 30),
      duration: 30,
      maxSlots: 1
    });
    setIsDialogOpen(true);
    setEditingSlot(null);
  };

  const handleEditSlot = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setNewSlot({
      id: slot.id,
      startTime: slot.startTime || slot.slot || "09:00",
      endTime: slot.endTime || calculateEndTime(slot.slot || slot.startTime || "09:00", slot.duration),
      duration: slot.duration,
      maxSlots: slot.maxSlots || 1
    });
    setIsDialogOpen(true);
  };

  const handleRemoveSlot = async (slotId: string) => {
    if (!selectedDate) return;
    
    setLoading(true);
    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      
      // Filter out the slot to be removed
      const updatedSlots = customSlots.filter(slot => slot.id !== slotId);
      
      const response = await fetch("/api/bookings/custom-slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: formattedDate,
          slots: updatedSlots,
          userId,
        }),
      });

      if (!response.ok) throw new Error("Failed to update time slots");
      
      toast({
        title: "Success",
        description: "Time slot removed successfully",
      });
      
      // Update the local state
      setCustomSlots(updatedSlots);
      // Refresh the available slots
      fetchTimeSlots(formattedDate);
    } catch (error) {
      console.error("Error removing time slot:", error);
      toast({
        title: "Error",
        description: "Failed to remove time slot",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSlot = async () => {
    if (!selectedDate) return;
    
    // Validate that start time is before end time
    const [startHour, startMinute] = newSlot.startTime.split(":").map(Number);
    const [endHour, endMinute] = newSlot.endTime.split(":").map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    if (endMinutes <= startMinutes) {
      toast({
        title: "Error",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }
    
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    let updatedSlots = [...customSlots];
    
    // If editing a regular slot (no id), we need to create a custom slot to override it
    if (!editingSlot?.id) {
      const regularSlot = availableSlots.find(slot => !slot.id && slot.slot === newSlot.startTime);
      if (regularSlot) {
        // Remove any existing custom slot for this time
        updatedSlots = updatedSlots.filter(slot => slot.startTime !== regularSlot.slot);
        // Add the new custom slot with override flag
        updatedSlots.push({
          ...newSlot,
          isCustom: true,
          overrideRegular: true // Add this flag to indicate this is overriding a regular slot
        });
      } else {
        // If it's a completely new slot, just add it
        updatedSlots.push({...newSlot, isCustom: true});
      }
    } else {
      // Update existing custom slot
      updatedSlots = updatedSlots.map(slot => 
        slot.id === editingSlot.id ? {...newSlot, isCustom: true} : slot
      );
    }
    
    setLoading(true);
    try {
      const response = await fetch("/api/bookings/custom-slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: formattedDate,
          slots: updatedSlots,
          userId,
        }),
      });

      if (!response.ok) throw new Error("Failed to save time slot");
      
      toast({
        title: "Success",
        description: editingSlot ? "Time slot updated successfully" : "Time slot added successfully",
      });
      
      setIsDialogOpen(false);
      fetchTimeSlots(formattedDate);
    } catch (error) {
      console.error("Error saving time slot:", error);
      toast({
        title: "Error",
        description: "Failed to save time slot",
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
          label="Date-Specific Settings"
          message="Manage your availability for specific dates. Block out dates or add custom time slots for holidays, vacations, or special hours."
        />
      </div>
      <div className="lg:col-span-4 space-y-6">
        <div className="p-4 bg-blue-50 rounded-md mb-6">
          <p className="text-sm text-blue-800">
            <strong>Quick Actions:</strong> Select a date to block it completely or add custom time slots.
            Blocked dates will not show any available slots to customers.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Select Date
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="rounded-md border"
                disabled={(date) => isBefore(date, startOfDay(new Date()))}
              />
              {selectedDate && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">
                      {format(selectedDate, "MMMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isBlocked}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleBlockDate();
                        } else {
                          handleUnblockDate();
                        }
                      }}
                    />
                    <span className="text-sm text-gray-600">
                      {isBlocked ? "Blocked" : "Available"}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Time Slots</CardTitle>
              {!isBlocked && (
                <Button onClick={handleAddSlot} variant="outline">
                  Add Custom Slot
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader loading={true}>Loading slots...</Loader>
                </div>
              ) : isBlocked ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Date Blocked</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    This date is blocked and no appointments can be booked.
                  </p>
                </div>
              ) : availableSlots.length > 0 ? (
                <div className={`space-y-3 ${availableSlots.length > 5 ? 'max-h-[300px] overflow-y-auto pr-2' : ''}`}>
                  {availableSlots.map((slot, index) => {
                    const isCustomSlot = slot.isCustom;
                    return (
                      <div 
                        key={index} 
                        className="p-3 border rounded-md flex items-center justify-between hover:border-blue-300 transition-colors cursor-pointer"
                        onClick={() => {
                          setEditingSlot(slot);
                          setNewSlot({
                            id: slot.id,
                            startTime: slot.slot,
                            endTime: calculateEndTime(slot.slot, slot.duration),
                            duration: slot.duration,
                            maxSlots: slot.maxSlots || 1
                          });
                          setIsDialogOpen(true);
                        }}
                      >
                        <div className="space-y-1">
                          <div className="font-medium flex items-center gap-2">
                            {/* Convert 24-hour format times to 12-hour format for display */}
                            {slot.slot.includes(':') && !slot.slot.includes('M') ? 
                              convertTo12HourFormat(slot.slot) : 
                              slot.slot} {" - "} 
                            {convertTo12HourFormat(calculateEndTime(slot.slot, slot.duration))} {" "}
                            ({slot.duration} min)
                            {isCustomSlot ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-800">Custom</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-100 text-gray-800">Regular</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Max bookings: {slot.maxSlots || 1}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No custom time slots for this date
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Time Slot Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <select
                id="startTime"
                value={newSlot.startTime}
                onChange={(e) => {
                  const newStartTime = e.target.value;
                  setNewSlot({
                    ...newSlot,
                    startTime: newStartTime,
                    // Update endTime based on selected duration
                    endTime: calculateEndTime(newStartTime, newSlot.duration)
                  });
                }}
                className="w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 pl-2"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={time} value={convertTo24HourFormat(time)}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <div className="text-sm text-muted-foreground mb-1">
                Auto-calculated based on start time and duration
              </div>
              <div className="p-2 border border-gray-300 rounded-md bg-gray-50">
                {convertTo12HourFormat(newSlot.endTime)}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <select
                id="duration"
                value={newSlot.duration}
                onChange={(e) => {
                  const newDuration = parseInt(e.target.value);
                  setNewSlot({
                    ...newSlot,
                    duration: newDuration,
                    // Update endTime based on selected duration
                    endTime: calculateEndTime(newSlot.startTime, newDuration)
                  });
                }}
                className="w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 pl-2"
              >
                {DURATION_OPTIONS.map(duration => (
                  <option key={duration} value={duration}>{duration} minutes</option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="maxSlots">Maximum Concurrent Bookings</Label>
              <Input
                id="maxSlots"
                type="number"
                min={1}
                value={newSlot.maxSlots}
                onChange={(e) => setNewSlot({...newSlot, maxSlots: parseInt(e.target.value)})}
                className="w-full mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (editingSlot) {
                  if (editingSlot.id) {
                    handleRemoveSlot(editingSlot.id);
                  } else {
                    // For regular slots we need to create an override that hides it
                    const slot = editingSlot.slot || editingSlot.startTime;
                    toast({
                      title: "Info",
                      description: "Regular slots cannot be deleted individually. Please adjust your weekly schedule instead.",
                    });
                  }
                  setIsDialogOpen(false);
                }
              }}
              disabled={!editingSlot}
            >
              {editingSlot && editingSlot.id ? "Delete Slot" : "Cannot Delete Regular Slot"}
            </Button>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSlot}>
              <Loader loading={loading}>Save Changes</Loader>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};