import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateTimeSlots, formatTimeSlot } from "@/lib/time-slots";
import { format } from "date-fns";

interface CustomTimeSlot {
  startTime: string;
  endTime: string;
  duration: number;
  maxSlots: number;
}

interface TimeSlot {
  slot: string;
  startTime?: string;
  endTime?: string;
  duration: number;
  maxSlots: number;
  id?: string;
  isCustom?: boolean;
}

function isOverlapping(startTime1: Date, endTime1: Date, startTime2: Date, endTime2: Date): boolean {
  return startTime1 < endTime2 && startTime2 < endTime1;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");
    const userId = searchParams.get("userId");

    console.log(`Available slots request for date: ${date}, userId: ${userId}`);

    if (!date || !userId) {
      return NextResponse.json(
        { error: "Date and userId are required" },
        { status: 400 }
      );
    }

    // Parse the date with timezone handling to ensure it's the same as selected in UI
    const parsedDate = new Date(date);
    
    // Ensure we're getting the correct day, month, year regardless of time
    const selectedDay = parsedDate.getDate();
    const selectedMonth = parsedDate.getMonth();
    const selectedYear = parsedDate.getFullYear();
    
    // Create start and end time markers for the selected date (in local timezone)
    const startOfDay = new Date(selectedYear, selectedMonth, selectedDay, 0, 0, 0, 0);
    const endOfDay = new Date(selectedYear, selectedMonth, selectedDay, 23, 59, 59, 999);
    
    console.log("Querying date range:", {
      start: startOfDay.toISOString(),
      end: endOfDay.toISOString()
    });

    // Get existing bookings for the date range
    const existingBookings = await prisma.booking.findMany({
      where: {
        userId: userId,
        startTime: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      select: {
        startTime: true,
        endTime: true
      }
    });

    // Get custom time slots for the selected date
    const customTimeSlots = await prisma.customTimeSlot.findMany({
      where: {
        userId: userId,
        startTime: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    });

    console.log(`Found ${customTimeSlots.length} custom time slots for ${date}`);
    if (customTimeSlots.length > 0) {
      customTimeSlots.forEach(slot => {
        console.log(`Custom slot: ${slot.startTime.toISOString()} - ${slot.endTime.toISOString()}`);
      });
    }

    // Get blocked dates
    const blockedDate = await prisma.blockedDate.findFirst({
      where: {
        userId: userId,
        date: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    });

    // Get booking calendar settings
    const bookingSettings = await prisma.bookingCalendarSettings.findFirst({
      where: {
        userSettings: {
          userId: userId
        }
      }
    });

    // Helper function to calculate end time
    const calculateEndTime = (startTime: string, durationMinutes: number): string => {
      const [hours, minutes] = startTime.split(':').map(Number);
      let totalMinutes = hours * 60 + minutes + durationMinutes;
      const endHours = Math.floor(totalMinutes / 60);
      const endMinutes = totalMinutes % 60;
      return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    };

    let availableSlots: TimeSlot[] = [];
    
    // Check if we have booking settings
    if (bookingSettings && bookingSettings.timeZone) {
      try {
        // Parse the settings
        const settingsData = JSON.parse(bookingSettings.timeZone);
        
        // Get the day of week (0-6, Sunday is 0)
        const dayOfWeek = parsedDate.getDay();
        const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayMap[dayOfWeek];
        
        // Check if we have the new format with dayTimeSlots
        if (settingsData.dayTimeSlots && settingsData.availableDays) {
          // Check if this day is available
          if (settingsData.availableDays.includes(dayName)) {
            const daySettings = settingsData.dayTimeSlots[dayName];
            
            if (daySettings) {
              // Convert times to 24h format if needed
              const isTimeFormat12h = daySettings.startTime.includes('AM') || 
                                      daySettings.startTime.includes('PM') || 
                                      daySettings.endTime.includes('AM') || 
                                      daySettings.endTime.includes('PM');
              
              let startTime, endTime;
              
              if (isTimeFormat12h) {
                // Convert 12h to 24h format
                const startParts = daySettings.startTime.match(/(\d+):(\d+)\s?(AM|PM)/i);
                const endParts = daySettings.endTime.match(/(\d+):(\d+)\s?(AM|PM)/i);
                
                if (startParts && endParts) {
                  let startHour = parseInt(startParts[1]);
                  const startMinute = parseInt(startParts[2]);
                  const startPeriod = startParts[3].toUpperCase();
                  
                  let endHour = parseInt(endParts[1]);
                  const endMinute = parseInt(endParts[2]);
                  const endPeriod = endParts[3].toUpperCase();
                  
                  // Convert to 24-hour
                  if (startPeriod === 'PM' && startHour < 12) startHour += 12;
                  if (startPeriod === 'AM' && startHour === 12) startHour = 0;
                  
                  if (endPeriod === 'PM' && endHour < 12) endHour += 12;
                  if (endPeriod === 'AM' && endHour === 12) endHour = 0;
                  
                  startTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
                  endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
                } else {
                  // Fallback to defaults
                  startTime = '09:00';
                  endTime = '17:00';
                }
              } else {
                startTime = daySettings.startTime;
                endTime = daySettings.endTime;
              }
              
              // Generate slots based on the user's settings
              const interval = daySettings.duration || 30;
              const maxSlots = daySettings.maxBookings || 1;
              
              // Generate slots from start to end time
              const [startHour, startMinute] = startTime.split(':').map(Number);
              const [endHour, endMinute] = endTime.split(':').map(Number);
              
              const startTotalMinutes = startHour * 60 + startMinute;
              const endTotalMinutes = endHour * 60 + endMinute;
              
              for (let time = startTotalMinutes; time < endTotalMinutes; time += interval) {
                const hour = Math.floor(time / 60);
                const minute = time % 60;
                
                const slotStart = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const slotEnd = calculateEndTime(slotStart, interval);
                
                // Skip if slot end time exceeds day end time
                const slotEndHour = parseInt(slotEnd.split(':')[0]);
                const slotEndMinute = parseInt(slotEnd.split(':')[1]);
                const slotEndTotalMinutes = slotEndHour * 60 + slotEndMinute;
                
                if (slotEndTotalMinutes <= endTotalMinutes) {
                  availableSlots.push({
                    slot: `${slotStart} - ${slotEnd}`,
                    startTime: slotStart,
                    endTime: slotEnd,
                    duration: interval,
                    maxSlots: maxSlots,
                    isCustom: false
                  });
                }
              }
            }
          }
        } 
        // Fallback to the old format if needed
        else if (settingsData[dayOfWeek]) {
          const daySlots = settingsData[dayOfWeek];
          
          daySlots.forEach((slot: any) => {
            availableSlots.push({
              slot: `${slot.startTime} - ${slot.endTime}`,
              startTime: slot.startTime,
              endTime: slot.endTime,
              duration: slot.duration || 30,
              maxSlots: slot.maxBookings || 1,
              isCustom: false
            });
          });
        }
      } catch (error) {
        console.error("Error parsing booking settings:", error);
      }
    }

    // Process custom time slots to add to availableSlots
    if (customTimeSlots.length > 0) {
      customTimeSlots.forEach(slot => {
        // Extract hours and minutes
        const hours = slot.startTime.getHours();
        const minutes = slot.startTime.getMinutes();
        const endHours = slot.endTime.getHours();
        const endMinutes = slot.endTime.getMinutes();

        // Format times in 24-hour format
        const startTimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const endTimeStr = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
        
        // Calculate duration in minutes from start/end time
        const durationMinutes = Math.round((slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60));
        
        // Check if this slot is already fully booked
        const bookedCount = existingBookings.filter(booking => 
          isOverlapping(booking.startTime, booking.endTime, slot.startTime, slot.endTime)
        ).length;
        
        // Only add if not fully booked
        if (bookedCount < 1) { // Assuming max 1 booking per slot
          availableSlots.push({
            slot: `${startTimeStr} - ${endTimeStr}`,
            startTime: startTimeStr,
            endTime: endTimeStr,
            duration: durationMinutes,
            isCustom: true,
            maxSlots: 1,
            id: slot.id
          });
        }
      });
    }

    // Filter out booked slots
    const bookedSlotTimes = new Map();
    existingBookings.forEach(booking => {
      const hours = booking.startTime.getHours();
      const minutes = booking.startTime.getMinutes();
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const count = bookedSlotTimes.get(timeStr) || 0;
      bookedSlotTimes.set(timeStr, count + 1);
    });
    
    // Filter based on max concurrent bookings
    availableSlots = availableSlots.filter(slot => {
      const bookedCount = bookedSlotTimes.get(slot.startTime) || 0;
      return bookedCount < slot.maxSlots;
    });

    // Filter slots based on current time for same-day bookings
    const now = new Date();
    if (parsedDate.toDateString() === now.toDateString()) {
      availableSlots = availableSlots.filter(slot => {
        if (!slot.startTime) return false;
        
        const [hours, minutes] = slot.startTime.split(':').map(Number);
        const slotTime = new Date(parsedDate);
        slotTime.setHours(hours, minutes, 0, 0);
        return slotTime > now;
      });
    }

    // If the date is blocked, return empty slots array
    if (blockedDate) {
      console.log('Date is blocked, returning empty slots array');
      return NextResponse.json({ slots: [] });
    }

    // Sort all slots by start time (chronologically)
    availableSlots.sort((a, b) => {
      // Ensure we have start times to compare
      if (!a.startTime || !b.startTime) return 0;
      
      // Parse hours and minutes for comparison
      const [aHours, aMinutes] = a.startTime.split(':').map(Number);
      const [bHours, bMinutes] = b.startTime.split(':').map(Number);
      
      // Compare total minutes since midnight
      const aMinutesSinceMidnight = aHours * 60 + aMinutes;
      const bMinutesSinceMidnight = bHours * 60 + bMinutes;
      
      return aMinutesSinceMidnight - bMinutesSinceMidnight;
    });

    // Final logging of what we're returning
    console.log(`Returning ${availableSlots.length} total slots`);
    console.log('Custom slots being returned:', availableSlots.filter(slot => slot.isCustom === true).length);
    
    // Debug log to show the sorting order
    if (availableSlots.length > 0) {
      console.log("Slots being returned (first 5):");
      availableSlots.slice(0, 5).forEach((slot, i) => {
        console.log(`${i+1}. ${slot.startTime} - ${slot.endTime} (custom: ${slot.isCustom ? 'yes' : 'no'})`);
      });
    }

    return NextResponse.json({ slots: availableSlots });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch available slots" },
      { status: 500 }
    );
  }
}