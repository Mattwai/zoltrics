import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authConfig);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get userId from query parameter
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");
    
    // If no userId provided, use the authenticated user's ID
    const userId = userIdParam || session.user.id;
    
    // Verify that the requester has permission to access these services
    // Only allow the service owner or the authenticated user to view their services
    if (userIdParam && userIdParam !== session.user.id) {
      // Check if the authenticated user is an admin or has other permission
      // For now, simply require that users can only access their own services
      return NextResponse.json({ error: "Unauthorized to access other user's services" }, { status: 403 });
    }

    // Get all services for the user
    const services = await prisma.service.findMany({
      where: {
        userId: userId,
      },
      include: {
        pricing: true,
        status: true,
      },
    });

    // Format the services for the frontend
    const formattedServices = services.map((service) => ({
      id: service.id,
      name: service.name,
      pricing: service.pricing ? {
        price: service.pricing.price,
        currency: service.pricing.currency,
      } : null,
      isLive: service.status?.isLive || false,
    }));

    return NextResponse.json({ services: formattedServices });
  } catch (error) {
    console.error("[SERVICES_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 