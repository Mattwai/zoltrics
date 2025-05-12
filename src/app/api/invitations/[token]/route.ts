import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { InvitationStatus } from '@prisma/client';

// GET - Validate invitation token
export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Find invitation by token
    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 });
    }

    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      // Update status to expired if not already
      if (invitation.status !== InvitationStatus.EXPIRED) {
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { status: InvitationStatus.EXPIRED },
        });
      }
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Check if invitation has already been accepted
    if (invitation.status === InvitationStatus.ACCEPTED) {
      return NextResponse.json({ error: 'Invitation has already been accepted' }, { status: 400 });
    }

    // Return invitation details (excluding sensitive information)
    return NextResponse.json({
      email: invitation.email,
      name: invitation.name,
      company: invitation.company,
    });
  } catch (error) {
    console.error('Error validating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to validate invitation' },
      { status: 500 }
    );
  }
}

// POST - Accept invitation and create user
export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const { name, password } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // Find invitation by token
    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 });
    }

    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      // Update status to expired if not already
      if (invitation.status !== InvitationStatus.EXPIRED) {
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { status: InvitationStatus.EXPIRED },
        });
      }
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Check if invitation has already been accepted
    if (invitation.status === InvitationStatus.ACCEPTED) {
      return NextResponse.json({ error: 'Invitation has already been accepted' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Get free plan
    const freePlan = await prisma.billings.findFirst({
      where: { plan: 'STANDARD' },
    });

    if (!freePlan) {
      return NextResponse.json(
        { error: 'Free plan not found' },
        { status: 500 }
      );
    }

    // Create user
    const hashedPassword = await hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: invitation.email,
        name: name || invitation.name || invitation.email,
        password: hashedPassword,
        subscription: {
          connect: { id: freePlan.id },
        },
      },
    });

    // Update invitation status to ACCEPTED
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.ACCEPTED },
    });

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
} 