import { authConfig } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authConfig);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { bookingLink } = body;

    if (!bookingLink) {
      return NextResponse.json({ error: "Booking link is required" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { bookingLink },
      select: { bookingLink: true },
    });

    return NextResponse.json({ bookingLink: updatedUser.bookingLink });
  } catch (error) {
    console.error("Error updating booking link:", error);
    return NextResponse.json({ error: "Failed to update booking link" }, { status: 500 });
  }
} 