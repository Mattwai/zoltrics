import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/prisma";

// Helper function to generate time slots based on start time, end time, and duration
const generateTimeSlots = (startTime: string, endTime: string, duration: number) => {
  const slots = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  let currentHour = startHour;
  let currentMinute = startMinute;
  
  // Start time of the current slot
  let slotStartHour = currentHour;
  let slotStartMinute = currentMinute;
  
  while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
    // Calculate end time of this slot
    let nextMinute = currentMinute + duration;
    let nextHour = currentHour;
    
    // Adjust hour if minutes overflow
    while (nextMinute >= 60) {
      nextHour++;
      nextMinute -= 60;
    }
    
    // Only add the slot if it doesn't go beyond the end time
    if (nextHour < endHour || (nextHour === endHour && nextMinute <= endMinute)) {
      slots.push({
        slot: `${slotStartHour.toString().padStart(2, '0')}:${slotStartMinute.toString().padStart(2, '0')} - ${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`,
        duration,
      });
    }
    
    // Move to next slot
    slotStartHour = nextHour;
    slotStartMinute = nextMinute;
    currentHour = nextHour;
    currentMinute = nextMinute;
  }
  
  return slots;
};

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

    // Get custom time slots for the selected date
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

    let availableSlots: { slot: string; duration: number; maxSlots?: number; id?: string }[] = [];

    // If there are custom slots for this date, use them
    if (customSlots.length > 0) {
      availableSlots = customSlots.flatMap(slot => 
        generateTimeSlots(slot.startTime, slot.endTime, slot.duration).map(timeSlot => ({
          ...timeSlot,
          maxSlots: slot.maxSlots,
          id: slot.id,
        }))
      );
    } 
    // Otherwise, use the weekly settings
    else if (calendarSettings) {
      const weeklySlots = JSON.parse(calendarSettings.timeSlots as string);
      const daySlots = weeklySlots[dayOfWeek] || [];
      
      availableSlots = daySlots.flatMap((slot: any) => 
        generateTimeSlots(slot.startTime, slot.endTime, slot.duration)
      );
    }

    return NextResponse.json({ 
      slots: availableSlots,
      customSlots: customSlots
    });
  } catch (error) {
    console.error("Error fetching custom slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch custom slots" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { date, slots, userId } = await request.json();

    if (!date || !slots || !userId) {
      return NextResponse.json(
        { error: "Date, slots, and userId are required" },
        { status: 400 }
      );
    }

    const selectedDate = new Date(date);

    // Delete existing slots for this date
    await client.customTimeSlot.deleteMany({
      where: {
        userId,
        date: selectedDate,
      },
    });

    // Create new slots
    const newSlots = await Promise.all(
      slots.map((slot: any) =>
        client.customTimeSlot.create({
          data: {
            date: selectedDate,
            startTime: slot.startTime,
            endTime: slot.endTime,
            duration: slot.duration,
            maxSlots: slot.maxSlots,
            userId,
          },
        })
      )
    );

    return NextResponse.json({ slots: newSlots });
  } catch (error) {
    console.error("Error saving custom slots:", error);
    return NextResponse.json(
      { error: "Failed to save custom slots" },
      { status: 500 }
    );
  }
} 