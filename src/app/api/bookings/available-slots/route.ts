import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/prisma";

interface CustomTimeSlot {
  startTime: string;
  endTime: string;
  duration: number;
  maxSlots: number;
}

interface TimeSlot {
  slot: string;
  duration?: number;
  maxSlots?: number;
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

    // Generate available time slots
    let availableSlots: TimeSlot[] = [];
    
    // If there are custom slots for this date, use them
    if (customSlots.length > 0) {
      availableSlots = customSlots.flatMap((slot: CustomTimeSlot) => {
        const slots: TimeSlot[] = [];
        const [startHour, startMinute] = slot.startTime.split(':').map(Number);
        const [endHour, endMinute] = slot.endTime.split(':').map(Number);
        
        let currentHour = startHour;
        let currentMinute = startMinute;
        
        while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
          // Calculate end time of this slot
          let nextMinute = currentMinute + slot.duration;
          let nextHour = currentHour;
          
          // Adjust hour if minutes overflow
          while (nextMinute >= 60) {
            nextHour++;
            nextMinute -= 60;
          }
          
          // Only add the slot if it doesn't go beyond the end time
          if (nextHour < endHour || (nextHour === endHour && nextMinute <= endMinute)) {
            slots.push({
              slot: `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`,
              duration: slot.duration,
              maxSlots: slot.maxSlots,
            });
          }
          
          // Move to next slot
          currentHour = nextHour;
          currentMinute = nextMinute;
        }
        
        return slots;
      });
    }
    // Otherwise, use the weekly settings if available
    else if (calendarSettings && calendarSettings.timeSlots) {
      try {
        const weeklySlots = JSON.parse(calendarSettings.timeSlots as string);
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
        
        // Get slots for this day of the week
        if (weeklySlots[dayOfWeek] && weeklySlots[dayOfWeek].length > 0) {
          availableSlots = weeklySlots[dayOfWeek].flatMap((slot: any) => {
            const slots: TimeSlot[] = [];
            const [startHour, startMinute] = slot.startTime.split(':').map(Number);
            const [endHour, endMinute] = slot.endTime.split(':').map(Number);
            
            let currentHour = startHour;
            let currentMinute = startMinute;
            
            while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
              slots.push({
                slot: `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`,
                duration: slot.duration || 30,
                maxSlots: slot.maxBookings || 1,
              });
              
              // Move to next time slot
              currentMinute += (slot.duration || 30);
              if (currentMinute >= 60) {
                currentHour++;
                currentMinute = 0;
              }
            }
            
            return slots;
          });
        }
        // Check if this day is in availableDays
        else if (calendarSettings.availableDays && calendarSettings.availableDays.includes(dayName)) {
          // No specific slots for this day, but day is available - will return empty slots array
        }
      } catch (error) {
        console.error("Error parsing weekly time slots:", error);
      }
    }

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