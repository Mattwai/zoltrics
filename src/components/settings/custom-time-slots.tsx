"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader } from "@/components/loader";
import Section from "@/components/section-label";
import { Calendar } from "@/components/ui/calendar";
import { format, isAfter, isBefore, startOfDay } from "date-fns";
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
import { generateTimeOptions, calculateDuration, calculateEndTime } from "@/lib/time-slots";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Clock, Calendar as CalendarIcon, X } from "lucide-react";

interface TimeSlot {
  id?: string;
  startTime: string;
  endTime: string;
  duration: number;
  maxSlots: number;
  isCustom?: boolean;
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
  };

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
    
    setLoading(true);
    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const remainingSlots = customSlots.filter(slot => slot.id !== slotId);
      
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
      
      // Update the local state
      setCustomSlots(remainingSlots);
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
    
    if (editingSlot?.id) {
      // Update existing slot
      updatedSlots = updatedSlots.map(slot => 
        slot.id === editingSlot.id ? {...newSlot, isCustom: true} : slot
      );
    } else {
      // Add new slot
      updatedSlots.push({...newSlot, isCustom: true});
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
                            {slot.slot} - {calculateEndTime(slot.slot, slot.duration)} ({slot.duration} min)
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
              <div className="font-medium">Time</div>
              <div className="text-sm text-muted-foreground">
                {newSlot.startTime} - {newSlot.endTime}
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-medium">Duration</div>
              <div className="text-sm text-muted-foreground">
                {newSlot.duration} minutes
              </div>
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
                handleRemoveSlot(editingSlot!.id!);
                setIsDialogOpen(false);
              }}
            >
              Delete Slot
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