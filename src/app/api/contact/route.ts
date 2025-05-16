import { NextResponse } from 'next/server';
import emailService from '@/lib/email';

export async function POST(request: Request) {
  try {
    const formData = await request.json();
    
    // Log the form submission
    console.log('Contact form submission:', formData);

    // Send email using centralized email service
    const emailResult = await emailService.sendContactFormEmail(formData);
    
    // Log the result but don't fail if email fails
    if (!emailResult.success) {
      console.warn('Email failed to send:', emailResult.error);
    }
    
    // Always return success to the user even if email fails
    return NextResponse.json({ 
      success: true, 
      message: 'Thank you for your interest! Our sales team will contact you shortly.' 
    });
  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process your request. Please try again.' },
      { status: 500 }
    );
  }
} 