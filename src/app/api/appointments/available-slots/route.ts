import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { format, parse, addMinutes } from "date-fns";
import { generateTimeSlots, formatTimeSlot, calculateEndTime } from "@/lib/time-slots";

// Define a type for the time slots structure
interface TimeSlot {
  startTime: string;
  endTime: string;
  duration: number;
  maxBookings: number;
}

// Define a type for the timeSlots structure that allows number indexing
interface TimeSlotsMap {
  [key: string]: TimeSlot[] | undefined;
  [key: number]: TimeSlot[] | undefined;
}

// Convert 12-hour format to 24-hour format
function convertTo24HourFormat(time12h: string): string {
  if (!time12h) return "00:00";
  try {
    const date = parse(time12h, 'h:mm a', new Date());
    return format(date, 'HH:mm');
  } catch (e) {
    console.error("Error converting time:", e);
    return time12h;
  }
}

// Add export to mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authConfig);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get date from query parameters
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const excludeBookingId = searchParams.get("excludeBookingId"); // Optional param to exclude a booking from conflict check

    if (!dateParam) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    // Create a date object for the requested date
    const requestedDate = new Date(dateParam);

    // Check if the date is blocked
    const blockedDate = await prisma.blockedDate.findFirst({
      where: {
        userId: session.user.id,
        date: requestedDate,
      },
    });

    // If the date is blocked, return empty slots with blocked flag
    if (blockedDate) {
      return NextResponse.json({ 
        slots: [],
        bookedSlots: [],
        isBlocked: true
      });
    }

    // Get the user's appointment settings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        userSettings: {
          include: {
            bookingCalendarSettings: true,
          }
        },
        customTimeSlots: {
          where: {
            startTime: {
              gte: new Date(`${dateParam}T00:00:00.000Z`),
              lt: new Date(`${dateParam}T23:59:59.999Z`),
            }
          }
        }
      },
    });

    // Format the date to get the day of week (0 = Sunday, 1 = Monday, etc.)
    const jsWeekDay = requestedDate.getDay(); // JS: 0 is Sunday, 1 is Monday, etc.
    
    // Get day name for the requested date
    const dayNameMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = dayNameMap[jsWeekDay];
    
    // Check if there's a custom time slot for this date
    const customSlots = user?.customTimeSlots || [];
    
    // Collect all generated time slots here
    let generatedTimeSlots: string[] = [];
    
    // First, process custom slots if they exist for this day
    if (customSlots.length > 0) {
      generatedTimeSlots = customSlots.map((slot) => {
        return `${format(slot.startTime, 'HH:mm')} - ${format(slot.endTime, 'HH:mm')}`;
      });
    } 
    // Otherwise, use the regular booking calendar settings
    else if (user?.userSettings?.bookingCalendarSettings?.timeZone) {
      // Parse the booking calendar settings from JSON
      let settingsData;
      try {
        settingsData = JSON.parse(user.userSettings.bookingCalendarSettings.timeZone);
        
        // Check if the day is available in the settings
        const availableDays = settingsData.availableDays || [];
        
        if (!availableDays.includes(dayName)) {
          // This day is not available for booking
          return NextResponse.json({ 
            slots: [], 
            bookedSlots: [], 
            isBlocked: false,
            message: `${dayName} is not available for booking according to your settings.`
          });
        }
        
        // Get the day's time slot settings
        if (settingsData.dayTimeSlots && settingsData.dayTimeSlots[dayName]) {
          const daySettings = settingsData.dayTimeSlots[dayName];
          let startTime, endTime;
          
          // Check if times are in 12-hour format
          if (daySettings.startTime.includes('AM') || daySettings.startTime.includes('PM')) {
            // Convert to 24-hour format for processing
            startTime = convertTo24HourFormat(daySettings.startTime);
            endTime = convertTo24HourFormat(daySettings.endTime);
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
          
          // Generate slots at each interval
          for (let time = startTotalMinutes; time < endTotalMinutes; time += interval) {
            const hour = Math.floor(time / 60);
            const minute = time % 60;
            
            const slotStart = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            
            // Calculate end time for this slot
            const slotEndMinutes = time + interval;
            const endHour = Math.floor(slotEndMinutes / 60);
            const endMinute = slotEndMinutes % 60;
            const slotEnd = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
            
            // Skip if slot end time exceeds day end time
            if (slotEndMinutes <= endTotalMinutes) {
              generatedTimeSlots.push(`${slotStart} - ${slotEnd}`);
            }
          }
        }
      } catch (error) {
        console.error("Error parsing booking settings:", error);
        // Default time slots if settings parsing fails
        generatedTimeSlots = [
          "09:00 - 09:30",
          "09:30 - 10:00",
          "10:00 - 10:30",
          "10:30 - 11:00",
          "11:00 - 11:30",
          "11:30 - 12:00",
          "13:00 - 13:30",
          "13:30 - 14:00",
          "14:00 - 14:30",
          "14:30 - 15:00",
          "15:00 - 15:30",
          "15:30 - 16:00",
        ];
      }
    } else {
      // If no settings found, return default half-hour slots
      generatedTimeSlots = [
        "09:00 - 09:30",
        "09:30 - 10:00",
        "10:00 - 10:30",
        "10:30 - 11:00",
        "11:00 - 11:30",
        "11:30 - 12:00",
        "13:00 - 13:30",
        "13:30 - 14:00",
        "14:00 - 14:30",
        "14:30 - 15:00",
        "15:00 - 15:30",
        "15:30 - 16:00",
      ];
    }
    
    // Get already booked slots for this date to exclude them
    const bookedAppointments = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
        startTime: {
          gte: new Date(`${dateParam}T00:00:00.000Z`),
          lt: new Date(`${dateParam}T23:59:59.999Z`),
        },
        ...(excludeBookingId ? { NOT: { id: excludeBookingId } } : {})
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
      },
    });

    // Format booked slots for comparison
    const bookedSlots = bookedAppointments.map((appointment) => 
      `${format(appointment.startTime, 'HH:mm')}-${format(appointment.endTime, 'HH:mm')}`
    );
    
    // Filter out already booked slots - this will remove any slot that overlaps with a booked appointment
    const availableTimeSlots = generatedTimeSlots.filter((slot: string) => {
      const slotFormatted = slot.replace(' - ', '-');
      
      // Check all booked slots for overlaps
      for (const bookedSlot of bookedSlots) {
        const [bookedStart, bookedEnd] = bookedSlot.split('-');
        const [slotStart, slotEnd] = slotFormatted.split('-');
        
        // Check if the slots overlap
        if ((slotStart <= bookedStart && slotEnd > bookedStart) || 
            (slotStart >= bookedStart && slotStart < bookedEnd)) {
          return false; // This slot overlaps with a booked appointment
        }
      }
      return true; // No overlaps found
    });

    // Log the full output for debugging
    console.log(`Generated ${generatedTimeSlots.length} time slots based on settings, ${availableTimeSlots.length} available after filtering out booked slots`);

    // Return available slots, booked slots, and blocked status
    return NextResponse.json({ 
      slots: availableTimeSlots,
      bookedSlots,
      isBlocked: false 
    });
  } catch (error) {
    console.error("[AVAILABLE_SLOTS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}