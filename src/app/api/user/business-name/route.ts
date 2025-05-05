import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { userId, businessName } = await req.json();

    // Verify the user is updating their own settings
    if (session.user.id !== userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Update the user's business name
    await prisma.user.update({
      where: { id: userId },
      data: { businessName },
    });

    return new NextResponse("Business name updated successfully", { status: 200 });
  } catch (error) {
    console.error("[BUSINESS_NAME_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 