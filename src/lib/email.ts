import nodemailer from 'nodemailer';

interface SendInvitationEmailParams {
  email: string;
  name: string;
  token: string;
}

interface ContactFormData {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone?: string;
  message?: string;
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html: string;
}

interface BulkEmailOptions {
  recipients: string[];
  subject: string;
  content: string;
  isHtml?: boolean;
}

// Create a centralized email service
class EmailService {
  private transporter: nodemailer.Transporter;
  
  constructor() {
    // Determine if using secure connection (port 465)
    const isSecure = process.env.EMAIL_SERVER_PORT === '465' || 
                    process.env.EMAIL_SERVER_SECURE === 'true';
    
    // Get port based on secure setting
    const port = Number(process.env.EMAIL_SERVER_PORT) || (isSecure ? 465 : 587);
    
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
      port,
      secure: isSecure,
      auth: {
        user: process.env.EMAIL_SERVER_USER || '',
        pass: process.env.EMAIL_SERVER_PASSWORD || '',
      },
      tls: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false // For development - consider removing in production
      },
      debug: true, // For development - consider removing in production
      logger: true // For development - consider removing in production
    });
  }

  // Generic method to send emails
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Log email attempt (without sensitive data)
      console.log(`Attempting to send email to: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
      console.log('Email subject:', options.subject);
      
      // Log email server config (without sensitive info)
      console.log('Email service config:', {
        host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
        port: Number(process.env.EMAIL_SERVER_PORT) || 587,
        secure: process.env.EMAIL_SERVER_SECURE === 'true',
        user: process.env.EMAIL_SERVER_USER ? '✓ Set' : '✗ Not set',
        pass: process.env.EMAIL_SERVER_PASSWORD ? '✓ Set' : '✗ Not set'
      });
      
      // Check if credentials are provided before attempting to send
      if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
        console.warn('Missing email credentials - skipping email send');
        return { success: false, error: 'Missing email credentials' };
      }
      
      // Verify connection configuration
      console.log('Verifying SMTP connection...');
      await this.transporter.verify();
      console.log('SMTP connection verified successfully');
      
      // Format mail options
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@bookerbuddy.com',
        ...options
      };
      
      // Send the email
      console.log('Sending email...');
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.response);
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error sending email' 
      };
    }
  }

  // Bulk email sender for marketing campaigns
  async sendBulkEmail(options: BulkEmailOptions): Promise<{ 
    success: boolean; 
    sentCount?: number; 
    failedCount?: number;
    error?: string 
  }> {
    try {
      if (!options.recipients || options.recipients.length === 0) {
        return { success: false, error: 'No recipients provided' };
      }
      
      console.log(`Attempting to send bulk email to ${options.recipients.length} recipients`);
      
      const emailOptions: EmailOptions = {
        to: options.recipients,
        subject: options.subject,
        html: options.isHtml ? options.content : `<div>${options.content}</div>`,
      };
      
      if (!options.isHtml) {
        emailOptions.text = options.content;
      }
      
      const result = await this.sendEmail(emailOptions);
      
      if (result.success) {
        return { 
          success: true, 
          sentCount: options.recipients.length,
          failedCount: 0
        };
      } else {
        return { 
          success: false, 
          sentCount: 0,
          failedCount: options.recipients.length,
          error: result.error 
        };
      }
    } catch (error) {
      console.error('Error sending bulk email:', error);
      return { 
        success: false, 
        sentCount: 0,
        failedCount: options.recipients.length,
        error: error instanceof Error ? error.message : 'Unknown error sending bulk email' 
      };
    }
  }

  // Specific method for invitation emails
  async sendInvitationEmail({ email, name, token }: SendInvitationEmailParams) {
    // Use NEXT_PUBLIC_BASE_URL if available, otherwise fall back to a default
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const invitationUrl = `${baseUrl}/invitations/${token}`;
    
    console.log('Generated invitation URL with base URL:', baseUrl);
    console.log('Final invitation URL:', invitationUrl);
    
    return this.sendEmail({
      to: email,
      subject: 'You\'ve been invited to BookerBuddy',
      html: `
        <div>
          <h1>Welcome to BookerBuddy!</h1>
          <p>Hi ${name},</p>
          <p>You've been invited to join BookerBuddy. Click the button below to accept the invitation and create your account.</p>
          <p>
            <a href="${invitationUrl}" style="
              display: inline-block;
              background-color: #4F46E5;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 4px;
              font-weight: 500;
            ">
              Accept Invitation
            </a>
          </p>
          <p>This invitation will expire in 7 days.</p>
          <p>If you didn't request this invitation, you can safely ignore this email.</p>
        </div>
      `
    });
  }

  // Specific method for contact form emails
  async sendContactFormEmail(formData: ContactFormData) {
    return this.sendEmail({
      to: process.env.EMAIL_TO || 'sales@bookerbuddy.xyz',
      subject: 'New Contact Form Submission from BookerBuddy',
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
<p>You have received a new contact request from the BookerBuddy website.</p>

<h2>Contact Details</h2>
<ul>
  <li><strong>Name:</strong> ${formData.firstName} ${formData.lastName}</li>
  <li><strong>Company:</strong> ${formData.company}</li>
  <li><strong>Email:</strong> ${formData.email}</li>
  <li><strong>Phone:</strong> ${formData.phone || 'Not provided'}</li>
</ul>

<h2>Message</h2>
<p>${formData.message || 'No message provided'}</p>
      `
    });
  }

  // Specific method for notification emails
  async sendNotificationEmail(email: string, subject: string, message: string) {
    return this.sendEmail({
      to: email,
      subject,
      html: `
<div>
  <h2>${subject}</h2>
  <p>${message}</p>
</div>
      `,
      text: message
    });
  }

  // Specific method for booking confirmation emails
  async sendBookingConfirmationEmail({
    email,
    name,
    date,
    time,
    service,
    bookingId,
    businessName,
    price,
    currency = "NZD"
  }: {
    email: string;
    name: string;
    date: string;
    time: string;
    service?: string;
    bookingId: string;
    businessName?: string;
    price?: number;
    currency?: string;
  }) {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Format the price if provided
    const formattedPrice = price !== undefined ? 
      new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: currency 
      }).format(price) : undefined;
    
    return this.sendEmail({
      to: email,
      subject: `Your Booking Confirmation${businessName ? ` - ${businessName}` : ''}`,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px; background-color: #ffffff;">
  <h1 style="color: #4F46E5; text-align: center; margin-bottom: 20px;">Booking Confirmation</h1>
  ${businessName ? `<h2 style="text-align: center; color: #374151; margin-bottom: 20px;">${businessName}</h2>` : ''}
  
  <p>Hi ${name},</p>
  
  <p>Thank you for your booking! Your appointment has been confirmed with the following details:</p>
  
  <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
    <p><strong>Booking ID:</strong> ${bookingId}</p>
    <p><strong>Date:</strong> ${formattedDate}</p>
    <p><strong>Time:</strong> ${time}</p>
    ${service ? `<p><strong>Service:</strong> ${service}</p>` : ''}
    ${formattedPrice ? `<p><strong>Price:</strong> ${formattedPrice}</p>` : ''}
  </div>
  
  <p>If you need to modify or cancel your booking, please contact us as soon as possible.</p>
  
  <p>We look forward to seeing you!</p>
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; text-align: center; color: #666666; font-size: 12px;">
    <p>This is an automated message. Please do not reply to this email.</p>
    ${businessName ? `<p>&copy; ${new Date().getFullYear()} ${businessName}</p>` : ''}
  </div>
</div>
      `,
      text: `
Booking Confirmation${businessName ? ` - ${businessName}` : ''}

Hi ${name},

Thank you for your booking! Your appointment has been confirmed with the following details:

Booking ID: ${bookingId}
Date: ${formattedDate}
Time: ${time}
${service ? `Service: ${service}` : ''}
${formattedPrice ? `Price: ${formattedPrice}` : ''}

If you need to modify or cancel your booking, please contact us as soon as possible.

We look forward to seeing you!
${businessName ? `\n\n${businessName}` : ''}
      `
    });
  }
}

// Create a singleton instance
const emailService = new EmailService();

// Export specific methods for backward compatibility
export function sendInvitationEmail(params: SendInvitationEmailParams) {
  return emailService.sendInvitationEmail(params);
}

export function sendContactFormEmail(formData: ContactFormData) {
  return emailService.sendContactFormEmail(formData);
}

export function sendNotificationEmail(email: string, subject: string, message: string) {
  return emailService.sendNotificationEmail(email, subject, message);
}

// Export new booking confirmation email function
export function sendBookingConfirmationEmail(params: {
  email: string;
  name: string;
  date: string;
  time: string;
  service?: string;
  bookingId: string;
  businessName?: string;
  price?: number;
  currency?: string;
}) {
  return emailService.sendBookingConfirmationEmail(params);
}

// Export the service as default
export default emailService; 