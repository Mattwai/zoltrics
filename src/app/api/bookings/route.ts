import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, date, slot, userId } = body;

    if (!name || !email || !date || !slot || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Make sure the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Find or create customer - explicitly set domainId to null for direct bookings
    const customer = await prisma.customer.upsert({
      where: { email },
      update: {},
      create: { 
        email,
        // Setting domainId to null explicitly marks this as a direct booking
        domainId: null 
      },
    });

    // Create booking with source information to differentiate from portal bookings
    const booking = await prisma.bookings.create({
      data: {
        date: new Date(date),
        slot,
        email,
        name,
        // Mark this booking with a null domainId to differentiate from portal bookings
        domainId: null,
        customerId: customer.id,
        // Set the source explicitly to direct_link
        source: "direct_link",
      },
    });

    // Optional: Send email notification
    // This would be implemented with your email service

    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
} 