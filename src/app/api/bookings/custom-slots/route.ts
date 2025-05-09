import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/prisma";
import { generateTimeSlots, formatTimeSlot, calculateEndTime } from "@/lib/time-slots";

// Convert 24-hour format to 12-hour format
function convertTo12HourFormat(time24h: string): string {
  const [hours, minutes] = time24h.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
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

    let availableSlots: { 
      slot: string; 
      duration: number; 
      maxSlots: number; 
      id?: string; 
      isCustom?: boolean;
    }[] = [];

    // Only add slots if the date is not blocked
    if (!blockedDate) {
      // Add custom slots for this date
      if (customSlots.length > 0) {
        customSlots.forEach(slot => {
          const startTimeStr = slot.startTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
          
          availableSlots.push({
            slot: startTimeStr,
            duration: slot.duration || 30,
            maxSlots: slot.maxSlots || 1,
            id: slot.id,
            isCustom: true
          });
        });
      }
    }

    // Sort slots by time
    availableSlots.sort((a, b) => {
      const timeA = a.slot;
      const timeB = b.slot;
      if (timeA < timeB) return -1;
      if (timeA > timeB) return 1;
      return 0;
    });

    // Format custom slots for the frontend
    const formattedCustomSlots = customSlots.map(slot => {
      const startTimeStr = slot.startTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      const endTimeStr = slot.endTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      
      return {
        id: slot.id,
        startTime: startTimeStr,
        endTime: endTimeStr,
        duration: slot.duration || 30,
        maxSlots: slot.maxSlots || 1,
        isCustom: true
      };
    });

    return NextResponse.json({ 
      slots: availableSlots,
      customSlots: formattedCustomSlots,
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

export async function POST(request: NextRequest) {
  try {
    const { date, slots, userId, isBlocked } = await request.json();
    console.log("Received data:", { date, slots, userId, isBlocked });

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

    // If slots array is provided
    if (slots) {
      // Keep track of processed IDs to know which to delete
      const processedIds = new Set<string>();
      
      // Create/update slots
      if (slots.length > 0) {
        const slotsPromises = slots.map(async (slot: any) => {
          if (slot.id) {
            processedIds.add(slot.id);
          }

          // Convert time strings to Date objects
          const [startHour, startMinute] = slot.startTime.split(':').map(Number);
          
          const startTime = new Date(selectedDate);
          startTime.setHours(startHour, startMinute, 0, 0);
          
          let endTime;
          if (slot.endTime) {
            const [endHour, endMinute] = slot.endTime.split(':').map(Number);
            endTime = new Date(selectedDate);
            endTime.setHours(endHour, endMinute, 0, 0);
          } else {
            // Calculate end time based on duration
            endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + (slot.duration || 30));
          }

          if (slot.id) {
            // Update existing slot
            await client.customTimeSlot.update({
              where: { id: slot.id },
              data: {
                startTime,
                endTime,
                duration: slot.duration || 30,
                maxSlots: slot.maxSlots || 1,
                overrideRegular: slot.overrideRegular || false,
                user: { connect: { id: userId } }
              },
            });
          } else {
            // Create new slot
            await client.customTimeSlot.create({
              data: {
                startTime,
                endTime,
                duration: slot.duration || 30,
                maxSlots: slot.maxSlots || 1,
                overrideRegular: slot.overrideRegular || false,
                user: { connect: { id: userId } }
              },
            });
          }
        });
        
        await Promise.all(slotsPromises);
      }
        
      // Delete slots that weren't included in the updated list
      const idsToDelete = existingSlots
        .map(slot => slot.id)
        .filter(id => !processedIds.has(id));
        
      if (idsToDelete.length > 0) {
        console.log("Deleting slots with IDs:", idsToDelete);
        await client.customTimeSlot.deleteMany({
          where: {
            id: { in: idsToDelete }
          }
        });
      } else if (slots.length === 0 && existingSlots.length > 0) {
        // If an empty array was explicitly provided, delete all slots for this date
        console.log("Deleting all slots for date:", date);
        await client.customTimeSlot.deleteMany({
          where: {
            userId,
            startTime: {
              gte: startOfDay,
              lt: endOfDay
            }
          }
        });
      }
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