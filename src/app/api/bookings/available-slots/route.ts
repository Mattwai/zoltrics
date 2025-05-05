import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/prisma";
import { generateTimeSlots, formatTimeSlot } from "@/lib/time-slots";

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

    // Parse the date string to create a date with the correct day
    let selectedDate: Date;
    
    // Check if the date is in ISO format or YYYY-MM-DD format
    if (date.includes('T')) {
      // It's an ISO string
      selectedDate = new Date(date);
    } else {
      // It's a YYYY-MM-DD format
      const [year, month, day] = date.split('-').map(Number);
      selectedDate = new Date(year, month - 1, day); // Month is 0-indexed in JavaScript Date
    }
    
    // Set the time to midnight for consistent date comparison
    selectedDate.setHours(0, 0, 0, 0);
    
    console.log('Original date string:', date);
    console.log('Parsed selected date:', selectedDate);
    
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Set up start and end of the selected day to query for custom slots
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    console.log('Querying custom slots from', startOfDay, 'to', endOfDay);

    // Get existing bookings for the selected date
    const existingBookings = await client.bookings.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        Customer: {
          Domain: {
            User: {
              id: userId
            }
          }
        }
      },
      select: {
        slot: true,
      },
    });

    // Get custom time slots for this date
    const customSlots = await client.customTimeSlot.findMany({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: {
        startTime: 'asc',
      },
    });
    
    console.log(`Found ${customSlots.length} custom slots for date:`, selectedDate);
    if (customSlots.length > 0) {
      console.log('Custom slots:', customSlots);
    }
    
    // Get weekly booking calendar settings
    const calendarSettings = await client.bookingCalendarSettings.findUnique({
      where: {
        userId,
      },
    });

    // Initialize available slots array
    let availableSlots: TimeSlot[] = [];
    
    // First add weekly slots from calendar settings
    if (calendarSettings && calendarSettings.timeSlots) {
      try {
        const weeklySlots = JSON.parse(calendarSettings.timeSlots as string);
        
        // Get slots for this day of the week
        if (weeklySlots[dayOfWeek] && weeklySlots[dayOfWeek].length > 0) {
          // Process each weekly slot
          weeklySlots[dayOfWeek].forEach((slot: any) => {
            // For each configuration, we need to generate all individual time slots
            // by incrementing the start time by the duration until we reach the end time
            let currentHour = parseInt(slot.startTime.split(':')[0]);
            let currentMinute = parseInt(slot.startTime.split(':')[1]);
            const endHour = parseInt(slot.endTime.split(':')[0]);
            const endMinute = parseInt(slot.endTime.split(':')[1]);
            const duration = slot.duration;
            
            // Generate all time slots between start and end time
            while (
              currentHour < endHour || 
              (currentHour === endHour && currentMinute < endMinute)
            ) {
              // Format the current time as a slot
              const timeSlot = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
              
              // Calculate end time based on duration
              let endHour = currentHour;
              let endMinute = currentMinute + duration;
              
              // Adjust if minutes overflow
              while (endMinute >= 60) {
                endHour++;
                endMinute -= 60;
              }
              
              const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
              
              // Add this slot to available slots
              availableSlots.push({
                slot: timeSlot,
                startTime: timeSlot,
                endTime: endTime,
                duration: duration,
                maxSlots: slot.maxBookings,
                isCustom: false
              });
              
              // Increment to the next slot based on duration
              currentMinute += duration;
              while (currentMinute >= 60) {
                currentHour++;
                currentMinute -= 60;
              }
            }
          });
        }
      } catch (error) {
        console.error("Error parsing weekly time slots:", error);
      }
    }
    
    // Now add custom slots - these are additional slots for specific dates
    if (customSlots.length > 0) {
      customSlots.forEach(slot => {
        // Calculate end time based on start time and duration
        const [startHour, startMinute] = slot.startTime.split(':').map(Number);
        let endHour = startHour;
        let endMinute = startMinute + slot.duration;
        
        // Adjust if minutes overflow
        while (endMinute >= 60) {
          endHour++;
          endMinute -= 60;
        }
        
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        
        availableSlots.push({
          slot: slot.startTime,
          startTime: slot.startTime,
          endTime: endTime,
          duration: slot.duration,
          maxSlots: slot.maxSlots,
          id: slot.id,
          isCustom: true
        });
      });
      
      console.log('After adding custom slots, available slots include:', 
        availableSlots.filter(slot => slot.isCustom === true).map(slot => ({
          slot: slot.slot,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isCustom: slot.isCustom
        }))
      );
    }

    // Sort slots by time
    availableSlots.sort((a, b) => {
      if (a.slot < b.slot) return -1;
      if (a.slot > b.slot) return 1;
      return 0;
    });

    // Filter out booked slots
    const bookedSlots = new Set(existingBookings.map((booking) => booking.slot));
    availableSlots = availableSlots.filter((slot) => !bookedSlots.has(slot.slot));

    // Filter slots based on current time for same-day bookings
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    
    if (isToday) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      availableSlots = availableSlots.filter(({ slot }) => {
        const [hour, minute] = slot.split(':').map(Number);
        return hour > currentHour || (hour === currentHour && minute > currentMinute);
      });
    }

    // Check if the date is blocked
    const blockedDate = await client.blockedDate.findFirst({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
    });

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