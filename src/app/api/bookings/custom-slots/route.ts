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

    // Parse the date with timezone handling to ensure it's the same as selected in UI
    const parsedDate = new Date(date);
    
    // Ensure we're getting the correct day, month, year regardless of time
    const selectedDay = parsedDate.getDate();
    const selectedMonth = parsedDate.getMonth();
    const selectedYear = parsedDate.getFullYear();
    
    // Create start and end time markers for the selected date (in local timezone)
    const startOfDay = new Date(selectedYear, selectedMonth, selectedDay, 0, 0, 0, 0);
    const endOfDay = new Date(selectedYear, selectedMonth, selectedDay, 23, 59, 59, 999);
    
    console.log("GET request for date:", date);
    console.log("Start of day:", startOfDay.toISOString());
    console.log("End of day:", endOfDay.toISOString());

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

    console.log(`Found ${customSlots.length} custom slots for date ${date}`);
    if (customSlots.length > 0) {
      console.log("Sample custom slot:", {
        id: customSlots[0].id,
        startTime: customSlots[0].startTime.toISOString(),
        endTime: customSlots[0].endTime.toISOString()
      });
    }

    // Get blocked status for the date
    const blockedDate = await client.blockedDate.findFirst({
      where: {
        userId,
        date: parsedDate,
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

    // Parse the date with timezone handling to ensure it's the same as selected in UI
    const parsedDate = new Date(date);
    // Adjust for timezone offset to keep the date consistent
    const timezoneOffsetMinutes = parsedDate.getTimezoneOffset();
    const adjustedDate = new Date(parsedDate.getTime() + timezoneOffsetMinutes * 60000);
    
    console.log("Original date from client:", date);
    console.log("Parsed date:", parsedDate.toISOString());
    console.log("Adjusted date for timezone:", adjustedDate.toISOString());
    
    // Ensure we're getting the correct day, month, year regardless of time
    const selectedDay = parsedDate.getDate();
    const selectedMonth = parsedDate.getMonth();
    const selectedYear = parsedDate.getFullYear();
    
    // Create start and end time markers for the selected date (in local timezone)
    const startOfDay = new Date(selectedYear, selectedMonth, selectedDay, 0, 0, 0, 0);
    const endOfDay = new Date(selectedYear, selectedMonth, selectedDay, 23, 59, 59, 999);
    
    console.log("Start of day:", startOfDay.toISOString());
    console.log("End of day:", endOfDay.toISOString());

    // Handle blocked date status
    if (typeof isBlocked === 'boolean') {
      if (isBlocked) {
        // Create or update blocked date
        const existingBlockedDate = await client.blockedDate.findFirst({
          where: {
            userId,
            date: parsedDate,
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
              date: parsedDate,
            },
          });
        }
      } else {
        // Remove blocked date
        await client.blockedDate.deleteMany({
          where: {
            userId,
            date: parsedDate,
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

    console.log("Existing slots found:", existingSlots.length);

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
          
          // Create a date with the user's selected date and the time from the slot
          const startTime = new Date(selectedYear, selectedMonth, selectedDay);
          startTime.setHours(startHour, startMinute, 0, 0);
          
          let endTime;
          if (slot.endTime) {
            const [endHour, endMinute] = slot.endTime.split(':').map(Number);
            endTime = new Date(selectedYear, selectedMonth, selectedDay);
            endTime.setHours(endHour, endMinute, 0, 0);
          } else {
            // Calculate end time based on duration
            endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + (slot.duration || 30));
          }

          console.log(`Slot time: ${startTime.toISOString()} to ${endTime.toISOString()}`);

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