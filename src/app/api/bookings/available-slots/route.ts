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
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Get existing bookings for the selected date
    const existingBookings = await client.bookings.findMany({
      where: {
        date: {
          equals: selectedDate,
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
        date: selectedDate,
      },
      orderBy: {
        startTime: 'asc',
      },
    });
    
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
              
              // Add this slot to available slots
              availableSlots.push({
                slot: timeSlot,
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
        availableSlots.push({
          slot: slot.startTime,
          duration: slot.duration,
          maxSlots: slot.maxSlots,
          id: slot.id,
          isCustom: true
        });
      });
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

    return NextResponse.json({ slots: availableSlots });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch available slots" },
      { status: 500 }
    );
  }
}