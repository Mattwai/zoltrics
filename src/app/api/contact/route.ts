import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Configure this with your email
const RECIPIENT_EMAIL = 'waidevelops@gmail.com'; // Change this to your actual sales email

export async function POST(request: Request) {
  try {
    const formData = await request.json();
    
    // Log the form submission
    console.log('Contact form submission:', formData);

    // Determine if using secure connection (port 465)
    const isSecure = process.env.EMAIL_SERVER_PORT === '465' || 
                    Boolean(process.env.EMAIL_SERVER_SECURE) || false;
    
    // Get port based on secure setting
    const port = Number(process.env.EMAIL_SERVER_PORT) || (isSecure ? 465 : 587);
    
    // Log configuration (without sensitive data)
    console.log('Email configuration:', {
      host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
      port,
      secure: isSecure,
      // Don't log actual credentials
      auth: { 
        user: process.env.EMAIL_SERVER_USER ? 'Set' : 'Not set',
        pass: process.env.EMAIL_SERVER_PASSWORD ? 'Set' : 'Not set'
      }
    });
    
    // Create a nodemailer transporter with proper credentials
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        // Use the actual credentials, not placeholder text
        user: process.env.EMAIL_SERVER_USER || '',
        pass: process.env.EMAIL_SERVER_PASSWORD || '',
      },
      tls: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false // Temporary for debugging
      },
      debug: true,
      logger: true
    });
    
    // Prepare the email content
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'website@yourdomain.com',
      to: process.env.EMAIL_TO || RECIPIENT_EMAIL,
      subject: 'New Contact Form Submission from Zoltrics',
      text: `
New contact form submission:

Name: ${formData.firstName} ${formData.lastName}
Company: ${formData.company}
Email: ${formData.email}
Phone: ${formData.phone || 'Not provided'}

Message:
${formData.message || 'No message provided'}
      `,
      html: `
<h1>New Contact Form Submission</h1>
<p>You have received a new contact request from the Zoltrics website.</p>

<h2>Contact Details</h2>
<ul>
  <li><strong>Name:</strong> ${formData.firstName} ${formData.lastName}</li>
  <li><strong>Company:</strong> ${formData.company}</li>
  <li><strong>Email:</strong> ${formData.email}</li>
  <li><strong>Phone:</strong> ${formData.phone || 'Not provided'}</li>
</ul>

<h2>Message</h2>
<p>${formData.message || 'No message provided'}</p>
      `,
    };
    
    try {
      // Check if credentials are provided before attempting to send
      if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
        console.warn('Missing email credentials - skipping email send');
      } else {
        // Verify connection configuration
        await transporter.verify();
        console.log('SMTP connection verified successfully');
        
        // Actually send the email
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
      }
    } catch (emailError) {
      // Log email errors but don't fail the request
      console.error('Error sending email:', emailError);
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