import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await client.customTimeSlot.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting custom slot:", error);
    return NextResponse.json(
      { error: "Failed to delete custom slot" },
      { status: 500 }
    );
  }
} 