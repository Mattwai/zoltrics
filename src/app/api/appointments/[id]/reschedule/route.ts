import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { date, slot } = body;

    if (!date || !slot) {
      return new NextResponse("Missing required fields: date and slot", { status: 400 });
    }

    // First, check if the booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        customer: true
      }
    });

    if (!booking) {
      return new NextResponse("Booking not found", { status: 404 });
    }

    // Check if the user has permission to update this booking
    const canUpdate = 
      booking.userId === session.user.id || // Direct booking
      booking.customer?.userId === session.user.id || // Customer booking
      (booking.customerId && !booking.userId && !booking.customer?.userId); // Customer booking with no user relationships

    if (!canUpdate) {
      return new NextResponse("Unauthorized to update this booking", { status: 403 });
    }

    // Update the booking with new date and slot
    const updatedBooking = await prisma.booking.update({
      where: { id: params.id },
      data: { 
        startTime: new Date(date + ' ' + slot.startTime), // Combine date and start time
        endTime: new Date(date + ' ' + slot.endTime),     // Combine date and end time
      },
    });

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("[BOOKING_RESCHEDULE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 