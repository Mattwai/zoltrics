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

    // Generate default time slots if no custom slots exist
    if (!customTimeSlots.length) {
      // Generate slots from 9 AM to 5 PM with 30-minute intervals
      const startHour = 9;
      const endHour = 17;
      const interval = 30; // minutes

      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += interval) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          availableSlots.push({
            slot: time,
            startTime: time,
            endTime: calculateEndTime(time, interval),
            duration: interval,
            isCustom: false,
            maxSlots: 1
          });
        }
      }
    }

    // Add custom time slots
    if (customTimeSlots.length > 0) {
      customTimeSlots.forEach(slot => {
        availableSlots.push({
          slot: format(slot.startTime, 'HH:mm'),
          startTime: format(slot.startTime, 'HH:mm'),
          endTime: format(slot.endTime, 'HH:mm'),
          duration: Math.round((slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60)),
          isCustom: true,
          maxSlots: 1
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