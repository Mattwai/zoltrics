import { NextResponse } from "next/server";
import { client } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { userId, businessName } = await req.json();

    // Verify that the user is updating their own business name
    if (session.user.id !== userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const updatedUser = await client.user.update({
      where: {
        id: userId,
      },
      data: {
        userBusinessProfile: {
          upsert: {
            create: {
              businessName,
            },
            update: {
              businessName,
            },
          },
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[BUSINESS_NAME_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 