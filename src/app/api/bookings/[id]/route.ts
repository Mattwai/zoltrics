import { authConfig } from "@/lib/auth";
import { client } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { depositPaid } = body;

    if (typeof depositPaid !== "boolean") {
      return NextResponse.json(
        { error: "Invalid deposit status" },
        { status: 400 }
      );
    }

    const booking = await client.bookings.update({
      where: { id: params.id },
      data: { depositPaid },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
} 