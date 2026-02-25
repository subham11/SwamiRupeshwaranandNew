/**
 * SendOtpEmail Lambda
 *
 * Standalone Lambda invoked asynchronously by CreateAuthChallenge.
 * Sends OTP via SMTP (nodemailer) without blocking the Cognito auth flow.
 */

import * as nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'mail.swamirupeshwaranand.in';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USERNAME = process.env.SMTP_USERNAME || 'noreply@swamirupeshwaranand.in';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || 'noreply@swamirupeshwaranand.in';
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'Swami Rupeshwaranand ji';

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false, // STARTTLS
  auth: {
    user: SMTP_USERNAME,
    pass: SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

interface OtpEmailEvent {
  email: string;
  otp: string;
}

export const handler = async (event: OtpEmailEvent): Promise<void> => {
  const { email, otp } = event;
  console.log(`SendOtpEmail invoked for: ${email}`);

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #f97316, #ea580c); border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0;">🙏 Swami Rupeshwaranand</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Path to Inner Peace</p>
  </div>
  <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Dear Seeker,</p>
    <p>Your One-Time Password for login is:</p>
    <div style="text-align: center; margin: 25px 0;">
      <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ea580c; background: #fff7ed; padding: 15px 30px; border-radius: 8px; border: 2px dashed #fb923c;">${otp}</span>
    </div>
    <p style="color: #6b7280;">This OTP is valid for <strong>5 minutes</strong>. Do not share it with anyone.</p>
    <p style="color: #6b7280;">If you did not request this, please ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="text-align: center; color: #9ca3af; font-size: 12px;">With divine blessings, Swami Rupeshwaranand Ashram</p>
  </div>
</body>
</html>`;

  try {
    const result = await transporter.sendMail({
      from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
      to: email,
      subject: 'Your Login OTP - Swami Rupeshwaranand',
      text: `Your OTP for Swami Rupeshwaranand login is: ${otp}\n\nThis OTP is valid for 5 minutes. Do not share it.\n\nWith blessings, Swami Rupeshwaranand Ashram`,
      html: htmlBody,
    });
    console.log(`OTP email sent via SMTP to ${email}: ${result.messageId}`);
  } catch (error) {
    console.error(`Failed to send OTP email to ${email}:`, error);
    // Don't throw — this is async, throwing won't help the user
    // The OTP is already stored in DynamoDB; user can request a resend
  }
};
