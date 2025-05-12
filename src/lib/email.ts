import nodemailer from 'nodemailer';

interface SendInvitationEmailParams {
  email: string;
  name: string;
  token: string;
}

export async function sendInvitationEmail({ email, name, token }: SendInvitationEmailParams) {
  const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invitations/${token}`;

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_SERVER_PORT) || 587,
    secure: process.env.EMAIL_SERVER_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@zoltrics.com',
    to: email,
    subject: 'You\'ve been invited to Zoltrics',
    html: `
      <div>
        <h1>Welcome to Zoltrics!</h1>
        <p>Hi ${name},</p>
        <p>You've been invited to join Zoltrics. Click the button below to accept the invitation and create your account.</p>
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
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending invitation email:', error);
    throw error;
  }
} 