import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface OtpEmailOptions {
  to: string;
  toName: string;
  otp: string;
  purpose: 'login' | 'signup' | 'reset-password';
  expiryMinutes?: number;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    this.fromEmail = this.configService.get<string>(
      'SMTP_FROM_EMAIL',
      'noreply@swamirupeshwaranand.in',
    );
    this.fromName = this.configService.get<string>('SMTP_FROM_NAME', 'Swami Rupeshwaranand ji');

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'mail.swamirupeshwaranand.in'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: false, // STARTTLS
      auth: {
        user: this.configService.get<string>('SMTP_USERNAME', 'noreply@swamirupeshwaranand.in'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
    });

    // Verify connection on startup (optional)
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.log('📧 SMTP connection verified successfully');
    } catch (error) {
      this.logger.warn('⚠️ SMTP connection verification failed:', error.message);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: options.toName ? `"${options.toName}" <${options.to}>` : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`📧 Email sent successfully to ${options.to}: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${options.to}:`, error.message);
      return false;
    }
  }

  /**
   * Send OTP email - supports both (email, otp) and (options) signatures
   */
  async sendOtpEmail(to: string, otp: string): Promise<boolean>;
  async sendOtpEmail(options: OtpEmailOptions): Promise<boolean>;
  async sendOtpEmail(toOrOptions: string | OtpEmailOptions, otp?: string): Promise<boolean> {
    if (typeof toOrOptions === 'string') {
      // Called with (email, otp) for backwards compatibility
      return this.sendOtpEmailInternal({
        to: toOrOptions,
        toName: toOrOptions.split('@')[0],
        otp: otp!,
        purpose: 'login',
        expiryMinutes: 10,
      });
    }
    return this.sendOtpEmailInternal(toOrOptions);
  }

  private async sendOtpEmailInternal(options: OtpEmailOptions): Promise<boolean> {
    const expiryMinutes = options.expiryMinutes || 10;
    const purposeText = this.getPurposeText(options.purpose);
    const subject = `Your OTP for ${purposeText} - Swami Rupeshwaranand`;

    const html = this.getOtpEmailTemplate({
      name: options.toName,
      otp: options.otp,
      purpose: purposeText,
      expiryMinutes,
    });

    const text = `
Dear ${options.toName},

Your One-Time Password (OTP) for ${purposeText} is: ${options.otp}

This OTP is valid for ${expiryMinutes} minutes. Please do not share this code with anyone.

If you did not request this OTP, please ignore this email.

With blessings,
Swami Rupeshwaranand Ashram
    `.trim();

    return this.sendEmail({
      to: options.to,
      toName: options.toName,
      subject,
      text,
      html,
    });
  }

  /**
   * Send password reset OTP email
   */
  async sendPasswordResetOtpEmail(to: string, otp: string): Promise<boolean> {
    return this.sendOtpEmailInternal({
      to,
      toName: to.split('@')[0],
      otp,
      purpose: 'reset-password',
      expiryMinutes: 10,
    });
  }

  async sendWelcomeEmail(to: string, name?: string): Promise<boolean> {
    const userName = name || to.split('@')[0];
    const subject = 'Welcome to Swami Rupeshwaranand Ashram';

    const html = this.getWelcomeEmailTemplate(userName);

    const text = `
Dear ${userName},

Welcome to the Swami Rupeshwaranand Ashram portal!

Your account has been successfully created. You can now access spiritual teachings, 
event updates, and connect with our community.

May your spiritual journey be blessed with peace and wisdom.

With divine blessings,
Swami Rupeshwaranand Ashram
    `.trim();

    return this.sendEmail({
      to,
      toName: name,
      subject,
      text,
      html,
    });
  }

  private getPurposeText(purpose: 'login' | 'signup' | 'reset-password'): string {
    switch (purpose) {
      case 'login':
        return 'Login Verification';
      case 'signup':
        return 'Account Registration';
      case 'reset-password':
        return 'Password Reset';
      default:
        return 'Verification';
    }
  }

  private getOtpEmailTemplate(params: {
    name: string;
    otp: string;
    purpose: string;
    expiryMinutes: number;
  }): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OTP Verification</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🙏 Swami Rupeshwaranand</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Ashram Portal</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px;">Dear ${params.name},</h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Your One-Time Password (OTP) for <strong>${params.purpose}</strong> is:
              </p>
              
              <!-- OTP Box -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 0 0 30px; border: 2px solid #f59e0b;">
                <span style="font-size: 42px; font-weight: 700; letter-spacing: 12px; color: #92400e; font-family: 'Courier New', monospace;">${params.otp}</span>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                ⏱️ This OTP is valid for <strong>${params.expiryMinutes} minutes</strong>.<br>
                🔒 Please do not share this code with anyone.
              </p>
              
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 0 8px 8px 0; margin: 0 0 20px;">
                <p style="color: #991b1b; font-size: 14px; margin: 0;">
                  ⚠️ If you did not request this OTP, please ignore this email or contact us immediately.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px;">With divine blessings,</p>
              <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0;">Swami Rupeshwaranand Ashram</p>
              <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0;">
                © ${new Date().getFullYear()} Swami Rupeshwaranand Ashram. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private getWelcomeEmailTemplate(name: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🙏 Welcome!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Swami Rupeshwaranand Ashram</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px;">Dear ${name},</h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Welcome to the Swami Rupeshwaranand Ashram portal! Your account has been successfully created.
              </p>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                You can now access:
              </p>
              
              <ul style="color: #4b5563; font-size: 16px; line-height: 2; margin: 0 0 30px; padding-left: 20px;">
                <li>📚 Spiritual teachings and discourses</li>
                <li>🗓️ Upcoming events and satsangs</li>
                <li>🎵 Bhajans and meditation guides</li>
                <li>👥 Community updates</li>
              </ul>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
                May your spiritual journey be blessed with peace, wisdom, and divine grace.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px;">With divine blessings,</p>
              <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0;">Swami Rupeshwaranand Ashram</p>
              <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0;">
                © ${new Date().getFullYear()} Swami Rupeshwaranand Ashram. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  // Generate a 6-digit OTP
  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send admin invitation email with temporary password
   */
  async sendAdminInviteEmail(
    to: string,
    name: string,
    role: string,
    temporaryPassword: string,
    loginUrl: string,
  ): Promise<boolean> {
    const roleLabel = role === 'admin' ? 'Administrator' : 
                      role === 'content_editor' ? 'Content Editor' : role;
    
    const html = this.generateInviteEmailTemplate(name, roleLabel, temporaryPassword, loginUrl);

    return this.sendEmail({
      to,
      toName: name,
      subject: `You've been invited to Swami Rupeshwaranand Ashram Portal`,
      html,
    });
  }

  private generateInviteEmailTemplate(
    name: string,
    role: string,
    temporaryPassword: string,
    loginUrl: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #c87530 0%, #e0a060 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">🙏 Swami Rupeshwaranand Ashram</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Admin Portal Invitation</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px;">Welcome, ${name}!</h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                You have been invited to join the Swami Rupeshwaranand Ashram portal as a <strong>${role}</strong>.
              </p>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="color: #92400e; font-size: 14px; margin: 0 0 10px; font-weight: 600;">Your Temporary Password:</p>
                <p style="color: #1f2937; font-size: 24px; font-weight: bold; margin: 0; font-family: monospace; letter-spacing: 2px;">
                  ${temporaryPassword}
                </p>
              </div>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Please use your email address and this temporary password to log in. You will be prompted to set a new password after your first login.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}" style="background: linear-gradient(135deg, #c87530 0%, #e0a060 100%); color: white; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block;">
                  Login to Portal
                </a>
              </div>
              
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0;">
                ⚠️ This password will expire in 7 days. Please log in and set your own password as soon as possible.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px;">With divine blessings,</p>
              <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0;">Swami Rupeshwaranand Ashram</p>
              <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0;">
                © ${new Date().getFullYear()} Swami Rupeshwaranand Ashram. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}
