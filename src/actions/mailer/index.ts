"use server";
import emailService from '@/lib/email';

export const onMailer = async (email: string) => {
  try {
    const result = await emailService.sendEmail({
      to: email,
      subject: "Realtime Support",
      html: "<p>One of your customers on BookerBuddy, just switched to realtime mode</p>",
      text: "One of your customers on BookerBuddy, just switched to realtime mode",
    });
    
    if (!result.success) {
      console.error('Failed to send realtime support email:', result.error);
      return { success: false, error: result.error };
    }
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error in onMailer:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error sending email' 
    };
  }
};
