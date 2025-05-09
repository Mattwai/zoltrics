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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");
    const userId = searchParams.get("userId");

    if (!date || !userId) {
      return NextResponse.json(
        { error: "Date and userId are required" },
        { status: 400 }
      );
    }

    const selectedDate = new Date(date);
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get existing bookings for the date range
    const existingBookings = await prisma.booking.findMany({
      where: {
        userId: userId,
        startTime: {
          gte: selectedDate,
          lt: nextDay
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
          gte: selectedDate,
          lt: nextDay
        }
      }
    });

    // Get blocked dates
    const blockedDate = await prisma.blockedDate.findFirst({
      where: {
        userId: userId,
        date: {
          gte: selectedDate,
          lt: nextDay
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
        const dayOfWeek = selectedDate.getDay();
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

    // Add custom time slots
    if (customTimeSlots.length > 0) {
      customTimeSlots.forEach(slot => {
        availableSlots.push({
          slot: `${format(slot.startTime, 'HH:mm')} - ${format(slot.endTime, 'HH:mm')}`,
          startTime: format(slot.startTime, 'HH:mm'),
          endTime: format(slot.endTime, 'HH:mm'),
          duration: slot.duration || Math.round((slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60)),
          isCustom: true,
          maxSlots: slot.maxSlots || 1,
          id: slot.id
        });
      });
    }

    // Filter out booked slots
    const bookedSlots = new Set(existingBookings.map(booking => 
      `${booking.startTime.toISOString()}-${booking.endTime.toISOString()}`
    ));
    availableSlots = availableSlots.filter(slot => 
      !bookedSlots.has(`${slot.startTime}-${slot.endTime}`)
    );

    // Filter slots based on current time for same-day bookings
    const now = new Date();
    if (selectedDate.toDateString() === now.toDateString()) {
      availableSlots = availableSlots.filter(slot => {
        const [hours, minutes] = slot.slot.split(':').map(Number);
        const slotTime = new Date();
        slotTime.setHours(hours, minutes, 0, 0);
        return slotTime > now;
      });
    }

    // If the date is blocked, return empty slots array
    if (blockedDate) {
      console.log('Date is blocked, returning empty slots array');
      return NextResponse.json({ slots: [] });
    }

    // Final logging of what we're returning
    console.log(`Returning ${availableSlots.length} total slots`);
    console.log('Custom slots being returned:', availableSlots.filter(slot => slot.isCustom === true).length);

    return NextResponse.json({ slots: availableSlots });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch available slots" },
      { status: 500 }
    );
  }
}