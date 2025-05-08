import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // First, just check if the booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        Customer: true
      }
    });

    if (!booking) {
      return new NextResponse("Booking not found", { status: 404 });
    }

    // Log the booking details for debugging
    console.log("Booking found:", {
      id: booking.id,
      userId: booking.userId,
      customerId: booking.customerId,
      customerUserId: booking.Customer?.userId
    });

    // Check if the user has permission to delete this booking
    // If the booking has a customerId but no userId/customerUserId, allow deletion
    const canDelete = 
      booking.userId === session.user.id || // Direct booking
      booking.Customer?.userId === session.user.id || // Customer booking
      (booking.customerId && !booking.userId && !booking.Customer?.userId); // Customer booking with no user relationships

    if (!canDelete) {
      return new NextResponse("Unauthorized to delete this booking", { status: 403 });
    }

    // Delete the booking
    await prisma.booking.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[BOOKING_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

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
    const { notes } = body;

    // First, check if the booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        Customer: true
      }
    });

    if (!booking) {
      return new NextResponse("Booking not found", { status: 404 });
    }

    // Check if the user has permission to update this booking
    const canUpdate = 
      booking.userId === session.user.id || // Direct booking
      booking.Customer?.userId === session.user.id || // Customer booking
      (booking.customerId && !booking.userId && !booking.Customer?.userId); // Customer booking with no user relationships

    if (!canUpdate) {
      return new NextResponse("Unauthorized to update this booking", { status: 403 });
    }

    // Update the booking notes
    const updatedBooking = await prisma.booking.update({
      where: { id: params.id },
      data: { notes },
    });

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("[BOOKING_UPDATE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 