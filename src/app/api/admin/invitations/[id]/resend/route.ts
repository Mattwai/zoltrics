import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import emailService from '@/lib/email';

// POST - Resend an invitation
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    
    // Check if user is authenticated and has admin role
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Invitation ID is required' }, { status: 400 });
    }

    // Find the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Check if invitation is already accepted
    if (invitation.status === 'ACCEPTED') {
      return NextResponse.json(
        { error: 'Invitation has already been accepted' },
        { status: 400 }
      );
    }

    // If invitation was expired, update it
    if (invitation.status === 'EXPIRED' || invitation.expiresAt < new Date()) {
      // Set new expiration date to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Update invitation
      await prisma.invitation.update({
        where: { id },
        data: {
          status: 'PENDING',
          expiresAt
        },
      });
    }

    // Resend the invitation email
    const emailResult = await emailService.sendInvitationEmail({
      email: invitation.email,
      name: invitation.name || invitation.email,
      token: invitation.token,
    });

    // Return result with email status
    if (!emailResult.success) {
      console.error('Failed to resend invitation email:', emailResult.error);
      return NextResponse.json({
        message: 'Failed to resend invitation email',
        error: emailResult.error,
        status: 'error'
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Invitation resent successfully',
      status: 'success'
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    return NextResponse.json(
      { error: 'Failed to resend invitation' },
      { status: 500 }
    );
  }
} 