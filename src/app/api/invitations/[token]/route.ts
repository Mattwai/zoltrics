import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hash } from 'bcrypt';
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

    console.log('Validating invitation token:', token);

    // Find invitation by token
    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      console.error('Invalid invitation token:', token);
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 });
    }

    console.log('Found invitation:', { id: invitation.id, email: invitation.email, status: invitation.status });

    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      console.log('Invitation has expired:', { id: invitation.id, expiresAt: invitation.expiresAt });
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
      console.log('Invitation already accepted:', { id: invitation.id });
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

    console.log('Processing invitation acceptance for token:', token);

    // Find invitation by token
    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      console.error('Invalid invitation token for acceptance:', token);
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 });
    }

    console.log('Found invitation for acceptance:', { id: invitation.id, email: invitation.email, status: invitation.status });

    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      console.log('Invitation has expired during acceptance:', { id: invitation.id, expiresAt: invitation.expiresAt });
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
      console.log('Invitation already accepted during acceptance flow:', { id: invitation.id });
      return NextResponse.json({ error: 'Invitation has already been accepted' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      console.log('User already exists during acceptance:', { email: invitation.email });
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
      console.error('Free plan not found');
      // Create a default plan if none exists
      const newFreePlan = await prisma.billings.create({
        data: {
          plan: 'STANDARD',
          credits: 10,
        },
      });
      console.log('Created new free plan:', newFreePlan);
      
      // Create user
      const hashedPassword = await hash(password, 12);
      const user = await prisma.user.create({
        data: {
          email: invitation.email,
          name: name || invitation.name || invitation.email,
          password: hashedPassword,
          role: invitation.role,
          subscription: {
            connect: { id: newFreePlan.id },
          },
        },
      });

      // Update invitation status to ACCEPTED
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED },
      });

      console.log('User created successfully with new plan:', { id: user.id, email: user.email });
      
      return NextResponse.json({
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    }

    // Create user with existing plan
    const hashedPassword = await hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: invitation.email,
        name: name || invitation.name || invitation.email,
        password: hashedPassword,
        role: invitation.role,
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

    console.log('User created successfully:', { id: user.id, email: user.email });

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