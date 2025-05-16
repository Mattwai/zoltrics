import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Find the booking in the database
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          include: {
            domain: {
              select: {
                name: true
              }
            }
          }
        },
        service: {
          include: {
            pricing: true
          }
        },
        bookingMetadata: true,
        bookingPayment: true
      }
    });

    if (!booking) {
      return new NextResponse("Booking not found", { status: 404 });
    }

    // Check if the user has permission to view this booking
    const canView = 
      booking.userId === session.user.id || // Direct booking
      booking.customer?.userId === session.user.id || // Customer booking
      (booking.customerId && !booking.userId && !booking.customer?.userId); // Customer booking with no user relationships

    if (!canView) {
      return new NextResponse("Unauthorized to view this booking", { status: 403 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("[BOOKING_DETAILS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 