"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader } from "@/components/loader";
import Section from "@/components/section-label";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";

interface TimeSlot {
  id?: string;
  startTime: string;
  endTime: string;
  duration: number;
  maxSlots: number;
}

interface CustomTimeSlotsProps {
  userId: string;
}

const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
});

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

export const CustomTimeSlots = ({ userId }: CustomTimeSlotsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [customSlots, setCustomSlots] = useState<TimeSlot[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSlot, setNewSlot] = useState<TimeSlot>({
    startTime: "09:00",
    endTime: "09:30",
    duration: 30,
    maxSlots: 1
  });

  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots(format(selectedDate, "yyyy-MM-dd"));
    }
  }, [selectedDate]);

  const fetchTimeSlots = async (date: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bookings/custom-slots?date=${date}&userId=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch time slots");
      
      const data = await response.json();
      setAvailableSlots(data.slots || []);
      setCustomSlots(data.customSlots || []);
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
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleAddSlot = () => {
    setNewSlot({
      startTime: "09:00",
      endTime: "09:30",
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
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: slot.duration,
      maxSlots: slot.maxSlots
    });
    setIsDialogOpen(true);
  };

  const handleRemoveSlot = async (slotId: string) => {
    if (!selectedDate) return;
    
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    const remainingSlots = customSlots.filter(slot => slot.id !== slotId);
    
    setLoading(true);
    try {
      const response = await fetch("/api/bookings/custom-slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: formattedDate,
          slots: remainingSlots,
          userId,
        }),
      });

      if (!response.ok) throw new Error("Failed to update time slots");
      
      toast({
        title: "Success",
        description: "Time slot removed successfully",
      });
      
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
    
    if (editingSlot?.id) {
      // Update existing slot
      updatedSlots = updatedSlots.map(slot => 
        slot.id === editingSlot.id ? newSlot : slot
      );
    } else {
      // Add new slot
      updatedSlots.push(newSlot);
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

  // Calculate duration in minutes between two time strings
  const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    return Math.max(0, endMinutes - startMinutes);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
      <div className="lg:col-span-1">
        <Section
          label="Custom Time Slots"
          message="Create date-specific time slots that override your weekly schedule. Select a date on the calendar to view and modify its available slots."
        />
      </div>
      <div className="lg:col-span-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Available Time Slots</CardTitle>
              <Button onClick={handleAddSlot} variant="outline">
                Add Slot
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader loading={true}>Loading slots...</Loader>
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="space-y-3">
                  {availableSlots.map((slot, index) => {
                    const originalSlot = customSlots.find(s => s.id === slot.id);
                    return (
                      <div key={index} className="p-3 border rounded-md flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {slot.slot} ({slot.duration} min)
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Max bookings: {slot.maxSlots || 1}
                          </div>
                        </div>
                        {originalSlot && (
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditSlot(originalSlot)}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleRemoveSlot(originalSlot.id!)}
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No time slots available for this date
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSlot ? "Edit Time Slot" : "Add Time Slot"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <select
                  id="startTime"
                  value={newSlot.startTime}
                  onChange={(e) => {
                    const newStartTime = e.target.value;
                    const calculatedDuration = calculateDuration(newStartTime, newSlot.endTime);
                    setNewSlot({
                      ...newSlot, 
                      startTime: newStartTime,
                      duration: calculatedDuration
                    });
                  }}
                  className="w-full mt-1 rounded-md"
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <select
                  id="endTime"
                  value={newSlot.endTime}
                  onChange={(e) => {
                    const newEndTime = e.target.value;
                    const calculatedDuration = calculateDuration(newSlot.startTime, newEndTime);
                    setNewSlot({
                      ...newSlot, 
                      endTime: newEndTime,
                      duration: calculatedDuration
                    });
                  }}
                  className="w-full mt-1 rounded-md"
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={newSlot.duration}
                disabled
                className="w-full mt-1 bg-gray-100 text-gray-600"
              />
            </div>

            <div>
              <Label htmlFor="maxSlots">Maximum Bookings</Label>
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSlot}>
              <Loader loading={loading}>Save</Loader>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
