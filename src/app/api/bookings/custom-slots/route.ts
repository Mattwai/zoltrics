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
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get custom time slots for the selected date
    const customSlots = await client.customTimeSlot.findMany({
      where: {
        userId,
        startTime: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Get blocked status for the date
    const blockedDate = await client.blockedDate.findFirst({
      where: {
        userId,
        date: selectedDate,
      },
    });

    let availableSlots: { slot: string; duration: number; maxSlots?: number; id?: string; isCustom?: boolean }[] = [];

    // Only add slots if the date is not blocked
    if (!blockedDate) {
      // Add custom slots for this date
      if (customSlots.length > 0) {
        customSlots.forEach(slot => {
          const startTimeStr = slot.startTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
          const endTimeStr = slot.endTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
          
          availableSlots.push({
            slot: `${startTimeStr} - ${endTimeStr}`,
            duration: Math.round((slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60)),
            maxSlots: 1,
            id: slot.id,
            isCustom: true
          });
        });
      }
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
      customSlots: customSlots,
      isBlocked: !!blockedDate
    });
  } catch (error) {
    console.error("Error fetching custom slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch custom slots" },
      { status: 500 }
    );
  }
}

function calculateEndTime(startTime: string, duration: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes + duration, 0, 0);
  return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
}

export async function POST(request: NextRequest) {
  try {
    const { date, slots, userId, isBlocked } = await request.json();

    if (!date || !userId) {
      return NextResponse.json(
        { error: "Date and userId are required" },
        { status: 400 }
      );
    }

    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Handle blocked date status
    if (typeof isBlocked === 'boolean') {
      if (isBlocked) {
        // Create or update blocked date
        const existingBlockedDate = await client.blockedDate.findFirst({
          where: {
            userId,
            date: selectedDate,
          },
        });

        if (existingBlockedDate) {
          await client.blockedDate.update({
            where: { id: existingBlockedDate.id },
            data: {},
          });
        } else {
          await client.blockedDate.create({
            data: {
              userId,
              date: selectedDate,
            },
          });
        }
      } else {
        // Remove blocked date
        await client.blockedDate.deleteMany({
          where: {
            userId,
            date: selectedDate,
          },
        });
      }
    }

    // Get existing custom slots for this date
    const existingSlots = await client.customTimeSlot.findMany({
      where: {
        userId,
        startTime: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
    });

    // Process slots
    if (slots && slots.length > 0) {
      const processedIds = new Set<string>();
      const slotsPromises = slots.map(async (slot: any) => {
        if (slot.id) {
          processedIds.add(slot.id);
        }

        // Convert time strings to Date objects
        const [startHour, startMinute] = slot.startTime.split(':').map(Number);
        const [endHour, endMinute] = slot.endTime.split(':').map(Number);
        
        const startTime = new Date(selectedDate);
        startTime.setHours(startHour, startMinute, 0, 0);
        
        const endTime = new Date(selectedDate);
        endTime.setHours(endHour, endMinute, 0, 0);

        if (slot.id) {
          // Update existing slot
          await client.customTimeSlot.update({
            where: { id: slot.id },
            data: {
              startTime,
              endTime,
              duration: Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)),
              user: { connect: { id: userId } }
            },
          });
        } else {
          // Create new slot
          await client.customTimeSlot.create({
            data: {
              startTime,
              endTime,
              duration: Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)),
              user: { connect: { id: userId } }
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

      await Promise.all(slotsPromises);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving custom slots:", error);
    return NextResponse.json(
      { error: "Failed to save custom slots" },
      { status: 500 }
    );
  }
}