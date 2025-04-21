import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/prisma";
import { generateTimeSlots, formatTimeSlot } from "@/lib/time-slots";

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

    let availableSlots: { slot: string; duration: number; maxSlots?: number; id?: string; isCustom?: boolean }[] = [];

    // Add weekly default slots
    if (calendarSettings && calendarSettings.timeSlots) {
      try {
        const weeklySlots = JSON.parse(calendarSettings.timeSlots as string);
        if (weeklySlots[dayOfWeek] && weeklySlots[dayOfWeek].length > 0) {
          // Add formatted weekly slots
          weeklySlots[dayOfWeek].forEach((slot: any) => {
            const endTime = calculateEndTime(slot.startTime, slot.duration);
            availableSlots.push({
              slot: formatTimeSlot(slot.startTime, endTime),
              duration: slot.duration,
              maxSlots: slot.maxBookings,
              isCustom: false
            });
          });
        }
      } catch (error) {
        console.error("Error parsing weekly slots:", error);
      }
    }

    // Add custom slots for this date - these are additional slots
    if (customSlots.length > 0) {
      customSlots.forEach(slot => {
        availableSlots.push({
          slot: formatTimeSlot(slot.startTime, slot.endTime),
          duration: slot.duration,
          maxSlots: slot.maxSlots,
          id: slot.id,
          isCustom: true
        });
      });
    }

    // Sort slots by time
    availableSlots.sort((a, b) => {
      const timeA = a.slot.split(' - ')[0];
      const timeB = b.slot.split(' - ')[0];
      if (timeA < timeB) return -1;
      if (timeA > timeB) return 1;
      return 0;
    });

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

// Helper to calculate end time from start time and duration
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hour, minute] = startTime.split(':').map(Number);
  
  let endMinute = minute + durationMinutes;
  let endHour = hour;
  
  while (endMinute >= 60) {
    endHour++;
    endMinute -= 60;
  }
  
  return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
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

    // Get existing custom slots first
    const existingSlots = await client.customTimeSlot.findMany({
      where: {
        userId,
        date: selectedDate,
      },
      select: {
        id: true
      }
    });

    // Create a set of IDs to keep track of which slots were processed
    const processedIds = new Set();
    
    // Update or create slots
    const slotsPromises = slots.map(async (slot: any) => {
      if (slot.id) {
        // Mark this ID as processed
        processedIds.add(slot.id);
        
        // Update existing slot
        return client.customTimeSlot.update({
          where: { id: slot.id },
          data: {
            startTime: slot.startTime,
            endTime: slot.endTime,
            duration: slot.duration,
            maxSlots: slot.maxSlots,
          },
        });
      } else {
        // Create new slot
        return client.customTimeSlot.create({
          data: {
            date: selectedDate,
            startTime: slot.startTime,
            endTime: slot.endTime,
            duration: slot.duration,
            maxSlots: slot.maxSlots,
            userId,
          },
        });
      }
    });
    
    // Delete slots that weren't included in the updated list
    const idsToDelete = existingSlots
      .map(slot => slot.id)
      .filter(id => !processedIds.has(id));
      
    if (idsToDelete.length > 0) {
      await client.customTimeSlot.deleteMany({
        where: {
          id: { in: idsToDelete }
        }
      });
    }

    const updatedSlots = await Promise.all(slotsPromises);

    return NextResponse.json({ slots: updatedSlots });
  } catch (error) {
    console.error("Error saving custom slots:", error);
    return NextResponse.json(
      { error: "Failed to save custom slots" },
      { status: 500 }
    );
  }
}