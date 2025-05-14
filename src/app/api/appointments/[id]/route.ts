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
        customer: {
          include: {
            domain: {
              select: {
                name: true
              }
            }
          }
        },
        bookingMetadata: true,
        bookingPayment: true
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
      customerUserId: booking.customer?.userId
    });

    // Check if the user has permission to delete this booking
    // If the booking has a customerId but no userId/customerUserId, allow deletion
    const canDelete = 
      booking.userId === session.user.id || // Direct booking
      booking.customer?.userId === session.user.id || // Customer booking
      (booking.customerId && !booking.userId && !booking.customer?.userId); // Customer booking with no user relationships

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
    const { notes, startTime, endTime, serviceId, paymentStatus } = body;

    // Validate required fields based on what's being updated
    if (startTime !== undefined && endTime !== undefined) {
      if (!startTime || !endTime) {
        return new NextResponse("Start time and end time are required", { status: 400 });
      }
    }

    // Parse dates and validate them if provided
    let parsedStartTime;
    let parsedEndTime;
    
    if (startTime && endTime) {
      parsedStartTime = new Date(startTime);
      parsedEndTime = new Date(endTime);

      if (isNaN(parsedStartTime.getTime()) || isNaN(parsedEndTime.getTime())) {
        return new NextResponse("Invalid date format", { status: 400 });
      }
    }

    // First, check if the booking exists
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

    // Check if the user has permission to update this booking
    const canUpdate = 
      booking.userId === session.user.id || // Direct booking
      booking.customer?.userId === session.user.id || // Customer booking
      (booking.customerId && !booking.userId && !booking.customer?.userId); // Customer booking with no user relationships

    if (!canUpdate) {
      return new NextResponse("Unauthorized to update this booking", { status: 403 });
    }

    // If booking is paid and trying to change service, prevent it
    if (serviceId && 
        booking.bookingPayment?.status === "paid" && 
        serviceId !== booking.serviceId) {
      return new NextResponse(
        "Cannot change service for a paid booking", 
        { status: 400 }
      );
    }

    // Fetch the new service if serviceId is changing
    let newService = null;
    if (serviceId && serviceId !== booking.serviceId) {
      newService = await prisma.service.findUnique({
        where: { id: serviceId },
        include: { pricing: true }
      });
      
      if (!newService) {
        return new NextResponse("Service not found", { status: 404 });
      }
    }

    // Prepare the update data
    const updateData: any = {
      bookingMetadata: notes !== undefined ? {
        update: {
          notes: notes || null
        }
      } : undefined,
    };

    // Add time updates if provided
    if (parsedStartTime && parsedEndTime) {
      updateData.startTime = parsedStartTime;
      updateData.endTime = parsedEndTime;
    }

    // Add service update if provided and allowed
    if (serviceId && serviceId !== booking.serviceId) {
      updateData.serviceId = serviceId;
      
      // Update payment amount if service has pricing
      if (newService?.pricing && booking.bookingPayment) {
        updateData.bookingPayment = {
          update: {
            amount: newService.pricing.price,
            currency: newService.pricing.currency || "NZD"
          }
        };
      }
    }

    // Update payment status if provided
    if (paymentStatus !== undefined && booking.bookingPayment) {
      // Initialize bookingPayment if it wasn't set earlier
      if (!updateData.bookingPayment) {
        updateData.bookingPayment = { update: {} };
      }
      
      // Add status to the update
      updateData.bookingPayment.update.status = paymentStatus;
    }

    // Update the booking
    const updatedBooking = await prisma.booking.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("[BOOKING_UPDATE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 