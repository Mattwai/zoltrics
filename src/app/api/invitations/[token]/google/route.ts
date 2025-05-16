import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';


export const dynamic = 'force-dynamic';
export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { userId, email } = await request.json();
    
    // Verify that the invitation exists and is valid
    const invitation = await prisma.invitation.findFirst({
      where: {
        token: params.token,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 400 }
      );
    }

    // Verify that the email matches the invitation
    if (invitation.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invitation was sent to a different email address' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user with any additional information from the invitation
    await prisma.user.update({
      where: { id: userId },
      data: {
        // Add any fields from invitation that should be applied to user
        // For example, company or role information
        ...(invitation.company && { company: invitation.company }),
      },
    });

    // Mark the invitation as accepted
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
      },
    });

    return NextResponse.json({
      message: 'Invitation accepted successfully',
      user: {
        id: existingUser.id,
        email: existingUser.email,
      },
    });
  } catch (error) {
    console.error('Error processing invitation with Google auth:', error);
    return NextResponse.json(
      { error: 'Failed to process invitation' },
      { status: 500 }
    );
  }
} 