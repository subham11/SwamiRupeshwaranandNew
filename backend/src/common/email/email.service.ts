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

export interface OrderItem {
  title: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderConfirmationData {
  orderId: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: ShippingAddress;
  paymentId: string;
}

export interface OrderStatusUpdateData {
  orderId: string;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  items: OrderItem[];
  totalAmount: number;
}

export interface SubscriptionConfirmationData {
  planName: string;
  price: number;
  features: string[];
  startDate: string;
  endDate: string;
}

export interface DonationThankYouData {
  amount: number;
  purpose: string;
  donorName: string;
  transactionId: string;
  date: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly baseUrl = 'https://bhairavapath.com';

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

  // ─── Shared Template Helpers ────────────────────────────────────────

  private emailShell(title: string, headerTitle: string, headerSubtitle: string, bodyHtml: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; -webkit-font-smoothing: antialiased;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6;">
    <tr>
      <td style="padding: 40px 16px;">
        <table role="presentation" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #F97316 0%, #EA580C 100%); padding: 36px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; font-family: system-ui, -apple-system, sans-serif;">${headerTitle}</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 15px; font-weight: 400;">${headerSubtitle}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 36px 30px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 13px; margin: 0 0 12px; line-height: 1.5;">
                <a href="${this.baseUrl}" style="color: #F97316; text-decoration: none; font-weight: 500;">Website</a>
                &nbsp;&middot;&nbsp;
                <a href="${this.baseUrl}/contact" style="color: #F97316; text-decoration: none; font-weight: 500;">Contact Us</a>
                &nbsp;&middot;&nbsp;
                <a href="${this.baseUrl}/about" style="color: #F97316; text-decoration: none; font-weight: 500;">About</a>
              </p>
              <p style="color: #6b7280; font-size: 13px; margin: 0 0 6px;">With divine blessings,</p>
              <p style="color: #1f2937; font-size: 15px; font-weight: 600; margin: 0 0 12px;">Swami Rupeshwaranand ji</p>
              <p style="color: #9ca3af; font-size: 11px; margin: 0 0 8px;">
                &copy; ${new Date().getFullYear()} Swami Rupeshwaranand Ashram. All rights reserved.
              </p>
              <p style="margin: 0;">
                <a href="${this.baseUrl}/unsubscribe" style="color: #9ca3af; font-size: 11px; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
  }

  private ctaButton(text: string, href: string): string {
    return `
<table role="presentation" style="width: 100%; border-collapse: collapse;">
  <tr>
    <td style="text-align: center; padding: 8px 0;">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="17%" strokecolor="#EA580C" fillcolor="#F97316">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">${text}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="${href}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #F97316 0%, #EA580C 100%); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 16px; font-weight: 600; font-family: system-ui, -apple-system, sans-serif; line-height: 1.2; mso-hide: all;">${text}</a>
      <!--<![endif]-->
    </td>
  </tr>
</table>`.trim();
  }

  private formatCurrency(amount: number): string {
    return `&#8377;${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // ─── OTP Email ──────────────────────────────────────────────────────

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

  // ─── Welcome Email ──────────────────────────────────────────────────

  async sendWelcomeEmail(to: string, name?: string): Promise<boolean> {
    const userName = name || to.split('@')[0];
    const subject = 'Welcome to Swami Rupeshwaranand Ashram';

    const html = this.getWelcomeEmailTemplate(userName);

    const text = `
Dear ${userName},

Namaste and a heartfelt welcome to the Swami Rupeshwaranand Ashram family!

Your account has been successfully created. We are blessed to have you join our spiritual community.

Here is what you can explore:
- Browse our collection of spiritual products and sacred items
- Explore profound teachings, discourses, and wisdom
- Subscribe to plans for exclusive spiritual content and blessings

Begin your journey: ${this.baseUrl}

May your path be illuminated with divine light, peace, and wisdom.

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

  // ─── Order Confirmation Email ───────────────────────────────────────

  async sendOrderConfirmationEmail(to: string, orderData: OrderConfirmationData): Promise<boolean> {
    const subject = `Order Confirmed - #${orderData.orderId}`;

    const itemRows = orderData.items
      .map(
        (item) => `
          <tr>
            <td style="padding: 12px 10px; border-bottom: 1px solid #f3f4f6; color: #374151; font-size: 14px; line-height: 1.4;">${item.title}</td>
            <td style="padding: 12px 10px; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px 10px; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px; text-align: right;">${this.formatCurrency(item.price)}</td>
            <td style="padding: 12px 10px; border-bottom: 1px solid #f3f4f6; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">${this.formatCurrency(item.subtotal)}</td>
          </tr>`,
      )
      .join('');

    const addr = orderData.shippingAddress;

    const bodyHtml = `
      <h2 style="color: #1f2937; margin: 0 0 8px; font-size: 22px; font-weight: 700;">Thank you for your order!</h2>
      <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        We have received your order and are getting it ready. A confirmation has been sent to your email.
      </p>

      <!-- Order Number Badge -->
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
        <tr>
          <td style="background-color: #FFF7ED; border: 1px solid #FDBA74; border-radius: 8px; padding: 16px; text-align: center;">
            <span style="color: #9A3412; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Order Number</span><br>
            <span style="color: #C2410C; font-size: 20px; font-weight: 700; font-family: monospace;">#${orderData.orderId}</span>
          </td>
        </tr>
      </table>

      <!-- Items Table -->
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 4px;">
        <tr>
          <td style="padding: 10px; background-color: #F97316; color: #ffffff; font-size: 13px; font-weight: 600; border-radius: 6px 0 0 0;">Item</td>
          <td style="padding: 10px; background-color: #F97316; color: #ffffff; font-size: 13px; font-weight: 600; text-align: center;">Qty</td>
          <td style="padding: 10px; background-color: #F97316; color: #ffffff; font-size: 13px; font-weight: 600; text-align: right;">Price</td>
          <td style="padding: 10px; background-color: #F97316; color: #ffffff; font-size: 13px; font-weight: 600; text-align: right; border-radius: 0 6px 0 0;">Subtotal</td>
        </tr>
        ${itemRows}
      </table>

      <!-- Total -->
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 28px;">
        <tr>
          <td style="padding: 14px 10px; text-align: right; color: #1f2937; font-size: 18px; font-weight: 700; border-top: 2px solid #F97316;">
            Total: ${this.formatCurrency(orderData.totalAmount)}
          </td>
        </tr>
      </table>

      <!-- Shipping Address -->
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
        <tr>
          <td style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
            <p style="color: #1f2937; font-size: 14px; font-weight: 600; margin: 0 0 8px;">Shipping Address</p>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0;">
              ${addr.fullName}<br>
              ${addr.addressLine1}<br>
              ${addr.city}, ${addr.state} - ${addr.pincode}
            </p>
          </td>
        </tr>
      </table>

      <!-- Payment Reference -->
      <p style="color: #6b7280; font-size: 13px; margin: 0 0 28px;">
        Payment Reference: <strong style="color: #374151;">${orderData.paymentId}</strong>
      </p>

      ${this.ctaButton('View Order', `${this.baseUrl}/account/orders/${orderData.orderId}`)}
    `;

    const html = this.emailShell('Order Confirmation', 'Order Confirmed!', 'Swami Rupeshwaranand ji', bodyHtml);

    const text = `
Order Confirmed - #${orderData.orderId}

Thank you for your order!

Order Number: #${orderData.orderId}

Items:
${orderData.items.map((i) => `- ${i.title} x${i.quantity} - Rs.${i.subtotal.toFixed(2)}`).join('\n')}

Total: Rs.${orderData.totalAmount.toFixed(2)}

Shipping Address:
${addr.fullName}
${addr.addressLine1}
${addr.city}, ${addr.state} - ${addr.pincode}

Payment Reference: ${orderData.paymentId}

View your order: ${this.baseUrl}/account/orders/${orderData.orderId}

With blessings,
Swami Rupeshwaranand Ashram
    `.trim();

    return this.sendEmail({ to, subject, text, html });
  }

  // ─── Order Status Update Email ──────────────────────────────────────

  async sendOrderStatusUpdateEmail(to: string, orderData: OrderStatusUpdateData): Promise<boolean> {
    const statusConfig: Record<string, { subject: string; heading: string; message: string; icon: string; color: string; bgColor: string }> = {
      processing: {
        subject: `Order #${orderData.orderId} is being prepared`,
        heading: 'We\'re Preparing Your Order',
        message: 'Our team is carefully preparing your items. We will notify you once your order has been shipped.',
        icon: '&#9881;',
        color: '#2563EB',
        bgColor: '#EFF6FF',
      },
      shipped: {
        subject: `Order #${orderData.orderId} has been shipped!`,
        heading: 'Your Order Is On Its Way!',
        message: 'Great news! Your order has been shipped and is on its way to you.',
        icon: '&#128230;',
        color: '#7C3AED',
        bgColor: '#F5F3FF',
      },
      delivered: {
        subject: `Order #${orderData.orderId} has been delivered`,
        heading: 'Your Order Has Been Delivered!',
        message: 'Your order has been successfully delivered. We hope you enjoy your items!',
        icon: '&#10003;',
        color: '#059669',
        bgColor: '#ECFDF5',
      },
      cancelled: {
        subject: `Order #${orderData.orderId} has been cancelled`,
        heading: 'Your Order Has Been Cancelled',
        message: 'Your order has been cancelled. If you did not request this cancellation, please contact us immediately.',
        icon: '&#10005;',
        color: '#DC2626',
        bgColor: '#FEF2F2',
      },
    };

    const config = statusConfig[orderData.status] || statusConfig.processing;

    const trackingHtml = orderData.trackingNumber
      ? `
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
        <tr>
          <td style="background-color: #F5F3FF; border: 1px dashed #A78BFA; border-radius: 8px; padding: 16px; text-align: center;">
            <span style="color: #6D28D9; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Tracking Number</span><br>
            <span style="color: #4C1D95; font-size: 18px; font-weight: 700; font-family: monospace; letter-spacing: 1px;">${orderData.trackingNumber}</span>
          </td>
        </tr>
      </table>`
      : '';

    const itemsList = orderData.items
      .map(
        (item) =>
          `<tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #374151; font-size: 14px;">${item.title}</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px; text-align: center;">x${item.quantity}</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">${this.formatCurrency(item.subtotal)}</td>
          </tr>`,
      )
      .join('');

    const bodyHtml = `
      <!-- Status Icon -->
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
        <tr>
          <td style="text-align: center;">
            <div style="display: inline-block; width: 64px; height: 64px; line-height: 64px; border-radius: 50%; background-color: ${config.bgColor}; color: ${config.color}; font-size: 28px; text-align: center;">${config.icon}</div>
          </td>
        </tr>
      </table>

      <h2 style="color: #1f2937; margin: 0 0 8px; font-size: 22px; font-weight: 700; text-align: center;">${config.heading}</h2>
      <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
        ${config.message}
      </p>

      <!-- Order Number -->
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 20px;">
        <tr>
          <td style="background-color: #FFF7ED; border-radius: 8px; padding: 12px 16px; text-align: center;">
            <span style="color: #9A3412; font-size: 13px;">Order </span>
            <span style="color: #C2410C; font-size: 15px; font-weight: 700; font-family: monospace;">#${orderData.orderId}</span>
          </td>
        </tr>
      </table>

      ${trackingHtml}

      <!-- Items Summary -->
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 8px;">
        ${itemsList}
      </table>
      <p style="text-align: right; color: #1f2937; font-size: 16px; font-weight: 700; margin: 8px 0 28px;">
        Total: ${this.formatCurrency(orderData.totalAmount)}
      </p>

      ${this.ctaButton('View Order', `${this.baseUrl}/account/orders/${orderData.orderId}`)}
    `;

    const html = this.emailShell('Order Status Update', config.heading, 'Swami Rupeshwaranand ji', bodyHtml);

    const text = `
${config.heading}

${config.message}

Order Number: #${orderData.orderId}
${orderData.trackingNumber ? `Tracking Number: ${orderData.trackingNumber}\n` : ''}
Items:
${orderData.items.map((i) => `- ${i.title} x${i.quantity} - Rs.${i.subtotal.toFixed(2)}`).join('\n')}

Total: Rs.${orderData.totalAmount.toFixed(2)}

View your order: ${this.baseUrl}/account/orders/${orderData.orderId}

With blessings,
Swami Rupeshwaranand Ashram
    `.trim();

    return this.sendEmail({ to, subject: config.subject, text, html });
  }

  // ─── Subscription Confirmation Email ────────────────────────────────

  async sendSubscriptionConfirmationEmail(to: string, data: SubscriptionConfirmationData): Promise<boolean> {
    const subject = `Subscription Confirmed - ${data.planName}`;

    const featureRows = data.features
      .map(
        (f) =>
          `<tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #374151; font-size: 14px;">
              <span style="color: #F97316; font-weight: 700; margin-right: 8px;">&#10003;</span> ${f}
            </td>
          </tr>`,
      )
      .join('');

    const bodyHtml = `
      <h2 style="color: #1f2937; margin: 0 0 8px; font-size: 22px; font-weight: 700;">Your Subscription Is Active!</h2>
      <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
        Thank you for subscribing. You now have full access to all the benefits of your plan.
      </p>

      <!-- Plan Card -->
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 28px;">
        <tr>
          <td style="background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%); border: 1px solid #FDBA74; border-radius: 12px; padding: 24px; text-align: center;">
            <p style="color: #9A3412; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Your Plan</p>
            <p style="color: #C2410C; font-size: 24px; font-weight: 700; margin: 0 0 4px;">${data.planName}</p>
            <p style="color: #EA580C; font-size: 28px; font-weight: 800; margin: 0;">${this.formatCurrency(data.price)}<span style="font-size: 14px; font-weight: 400; color: #9A3412;">/period</span></p>
          </td>
        </tr>
      </table>

      <!-- Features -->
      <p style="color: #1f2937; font-size: 15px; font-weight: 600; margin: 0 0 12px;">Plan Features</p>
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
        ${featureRows}
      </table>

      <!-- Billing Dates -->
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 28px;">
        <tr>
          <td style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Start Date</td>
                <td style="padding: 4px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${data.startDate}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Next Billing / End Date</td>
                <td style="padding: 4px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${data.endDate}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${this.ctaButton('Access Your Content', `${this.baseUrl}/account/subscriptions`)}
    `;

    const html = this.emailShell('Subscription Confirmed', 'Subscription Confirmed!', 'Swami Rupeshwaranand ji', bodyHtml);

    const text = `
Subscription Confirmed - ${data.planName}

Your subscription is now active!

Plan: ${data.planName}
Price: Rs.${data.price.toFixed(2)}/period

Features:
${data.features.map((f) => `- ${f}`).join('\n')}

Start Date: ${data.startDate}
Next Billing / End Date: ${data.endDate}

Access your content: ${this.baseUrl}/account/subscriptions

With blessings,
Swami Rupeshwaranand Ashram
    `.trim();

    return this.sendEmail({ to, subject, text, html });
  }

  // ─── Donation Thank You Email ───────────────────────────────────────

  async sendDonationThankYouEmail(to: string, data: DonationThankYouData): Promise<boolean> {
    const subject = 'Thank You for Your Generous Donation';

    const bodyHtml = `
      <!-- Heart Icon -->
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 20px;">
        <tr>
          <td style="text-align: center;">
            <div style="display: inline-block; width: 64px; height: 64px; line-height: 64px; border-radius: 50%; background-color: #FEF2F2; color: #EF4444; font-size: 32px; text-align: center;">&#9829;</div>
          </td>
        </tr>
      </table>

      <h2 style="color: #1f2937; margin: 0 0 8px; font-size: 22px; font-weight: 700; text-align: center;">Thank You, ${data.donorName}!</h2>
      <p style="color: #6b7280; font-size: 15px; line-height: 1.7; margin: 0 0 28px; text-align: center;">
        Your generous contribution makes a profound difference. Your donation supports the ashram's mission of spreading spiritual wisdom, serving the community, and preserving sacred traditions.
      </p>

      <!-- Donation Details Card -->
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
        <tr>
          <td style="background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%); border: 1px solid #FDBA74; border-radius: 12px; padding: 24px;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount</td>
                <td style="padding: 8px 0; color: #C2410C; font-size: 20px; font-weight: 700; text-align: right;">${this.formatCurrency(data.amount)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-top: 1px solid #FDBA74; color: #6b7280; font-size: 14px;">Purpose</td>
                <td style="padding: 8px 0; border-top: 1px solid #FDBA74; color: #374151; font-size: 14px; font-weight: 600; text-align: right;">${data.purpose}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-top: 1px solid #FDBA74; color: #6b7280; font-size: 14px;">Date</td>
                <td style="padding: 8px 0; border-top: 1px solid #FDBA74; color: #374151; font-size: 14px; text-align: right;">${data.date}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-top: 1px solid #FDBA74; color: #6b7280; font-size: 14px;">Transaction ID</td>
                <td style="padding: 8px 0; border-top: 1px solid #FDBA74; color: #374151; font-size: 13px; font-family: monospace; text-align: right;">${data.transactionId}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Tax Receipt Notice -->
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 28px;">
        <tr>
          <td style="background-color: #F0FDF4; border-left: 4px solid #22C55E; border-radius: 0 8px 8px 0; padding: 16px;">
            <p style="color: #166534; font-size: 14px; margin: 0; line-height: 1.5;">
              <strong>Tax Receipt:</strong> This email serves as your donation receipt. Please retain it for your records. Transaction ID <strong>${data.transactionId}</strong> can be used as a reference for tax purposes.
            </p>
          </td>
        </tr>
      </table>

      ${this.ctaButton('View Donation History', `${this.baseUrl}/account/donations`)}

      <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 20px 0 0; line-height: 1.5;">
        May the divine blessings of the ashram be with you always.
      </p>
    `;

    const html = this.emailShell('Donation Receipt', 'Thank You for Your Donation', 'Swami Rupeshwaranand ji', bodyHtml);

    const text = `
Thank You for Your Generous Donation, ${data.donorName}!

Your generous contribution makes a profound difference.

Donation Details:
- Amount: Rs.${data.amount.toFixed(2)}
- Purpose: ${data.purpose}
- Date: ${data.date}
- Transaction ID: ${data.transactionId}

This email serves as your donation receipt. Please retain it for your records.

View donation history: ${this.baseUrl}/account/donations

With divine blessings,
Swami Rupeshwaranand Ashram
    `.trim();

    return this.sendEmail({ to, subject, text, html });
  }

  // ─── Newsletter Welcome Email ───────────────────────────────────────

  async sendNewsletterWelcomeEmail(to: string): Promise<boolean> {
    const subject = 'Welcome to Our Newsletter - Swami Rupeshwaranand Ashram';

    const bodyHtml = `
      <h2 style="color: #1f2937; margin: 0 0 8px; font-size: 22px; font-weight: 700;">Namaste!</h2>
      <p style="color: #6b7280; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
        Thank you for subscribing to the Swami Rupeshwaranand Ashram newsletter. You are now part of a growing spiritual community dedicated to inner growth and divine wisdom.
      </p>

      <p style="color: #1f2937; font-size: 15px; font-weight: 600; margin: 0 0 16px;">Here's what you can expect:</p>

      <!-- What to Expect -->
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 28px;">
        <tr>
          <td style="padding: 14px 16px; background-color: #FFF7ED; border-radius: 8px 8px 0 0; border-bottom: 1px solid #FDBA74;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 32px; color: #F97316; font-size: 18px; vertical-align: top;">&#9758;</td>
                <td style="color: #374151; font-size: 14px; line-height: 1.5;"><strong>Spiritual Teachings</strong> - Regular insights and discourses from Swamiji</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 14px 16px; background-color: #FFF7ED; border-bottom: 1px solid #FDBA74;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 32px; color: #F97316; font-size: 18px; vertical-align: top;">&#9758;</td>
                <td style="color: #374151; font-size: 14px; line-height: 1.5;"><strong>Event Updates</strong> - Be the first to know about satsangs, retreats, and special programs</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 14px 16px; background-color: #FFF7ED; border-bottom: 1px solid #FDBA74;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 32px; color: #F97316; font-size: 18px; vertical-align: top;">&#9758;</td>
                <td style="color: #374151; font-size: 14px; line-height: 1.5;"><strong>Community News</strong> - Stories, celebrations, and ashram updates</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 14px 16px; background-color: #FFF7ED; border-radius: 0 0 8px 8px;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 32px; color: #F97316; font-size: 18px; vertical-align: top;">&#9758;</td>
                <td style="color: #374151; font-size: 14px; line-height: 1.5;"><strong>Exclusive Offers</strong> - Special access to spiritual resources and products</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${this.ctaButton('Visit Our Website', this.baseUrl)}

      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 24px 0 0; line-height: 1.5;">
        If you did not subscribe to this newsletter, you can safely <a href="${this.baseUrl}/unsubscribe" style="color: #F97316; text-decoration: underline;">unsubscribe here</a>.
      </p>
    `;

    const html = this.emailShell('Newsletter Welcome', 'Welcome to Our Newsletter', 'Swami Rupeshwaranand ji', bodyHtml);

    const text = `
Welcome to the Swami Rupeshwaranand Ashram Newsletter!

Namaste! Thank you for subscribing.

Here's what you can expect:
- Spiritual Teachings - Regular insights and discourses from Swamiji
- Event Updates - Be the first to know about satsangs, retreats, and special programs
- Community News - Stories, celebrations, and ashram updates
- Exclusive Offers - Special access to spiritual resources and products

Visit us: ${this.baseUrl}

To unsubscribe: ${this.baseUrl}/unsubscribe

With divine blessings,
Swami Rupeshwaranand Ashram
    `.trim();

    return this.sendEmail({ to, subject, text, html });
  }

  // ─── Admin Invite Email ─────────────────────────────────────────────

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
    const roleLabel =
      role === 'admin' ? 'Administrator' : role === 'content_editor' ? 'Content Editor' : role;

    const html = this.generateInviteEmailTemplate(name, roleLabel, temporaryPassword, loginUrl);

    return this.sendEmail({
      to,
      toName: name,
      subject: `You've been invited to Swami Rupeshwaranand Ashram Portal`,
      html,
    });
  }

  // Generate a 6-digit OTP
  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // ─── Private Template Methods ───────────────────────────────────────

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
    const isPasswordReset = params.purpose === 'Password Reset';
    const otpDigits = params.otp.split('').map(
      (d) => `<td style="width: 44px; height: 52px; background-color: #FFF7ED; border: 2px solid #FDBA74; border-radius: 8px; text-align: center; vertical-align: middle;"><span style="font-size: 26px; font-weight: 700; color: #9A3412; font-family: monospace;">${d}</span></td>`,
    ).join('<td style="width: 8px;"></td>');

    const securityWarning = isPasswordReset
      ? `
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
        <tr>
          <td style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 16px; border-radius: 0 8px 8px 0;">
            <p style="color: #991B1B; font-size: 14px; margin: 0 0 4px; font-weight: 600;">Security Notice</p>
            <p style="color: #991B1B; font-size: 13px; margin: 0; line-height: 1.5;">
              Someone requested a password reset for your account. If you did not make this request, please ignore this email and ensure your account is secure. Never share this code with anyone.
            </p>
          </td>
        </tr>
      </table>`
      : '';

    const bodyHtml = `
      <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 22px;">Dear ${params.name},</h2>

      <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        Your One-Time Password (OTP) for <strong>${params.purpose}</strong> is:
      </p>

      <!-- OTP Digits -->
      <table role="presentation" style="margin: 0 auto 28px; border-collapse: separate; border-spacing: 0;">
        <tr>
          ${otpDigits}
        </tr>
      </table>

      ${securityWarning}

      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 20px;">
        <tr>
          <td style="background-color: #FFF7ED; border-radius: 8px; padding: 16px;">
            <p style="color: #92400E; font-size: 14px; margin: 0; line-height: 1.5;">
              &#9200; This OTP is valid for <strong>${params.expiryMinutes} minutes</strong>.<br>
              &#128274; Please do not share this code with anyone.
            </p>
          </td>
        </tr>
      </table>

      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="background-color: #f9fafb; border-radius: 8px; padding: 14px;">
            <p style="color: #6b7280; font-size: 13px; margin: 0; line-height: 1.5;">
              If you did not request this OTP, please ignore this email or <a href="${this.baseUrl}/contact" style="color: #F97316; text-decoration: underline;">contact us</a> immediately.
            </p>
          </td>
        </tr>
      </table>
    `;

    return this.emailShell(
      'OTP Verification',
      isPasswordReset ? 'Password Reset' : 'Verification Code',
      'Swami Rupeshwaranand ji',
      bodyHtml,
    );
  }

  private getWelcomeEmailTemplate(name: string): string {
    const bodyHtml = `
      <h2 style="color: #1f2937; margin: 0 0 8px; font-size: 22px; font-weight: 700;">Namaste, ${name}!</h2>
      <p style="color: #6b7280; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
        We are truly blessed to welcome you to the Swami Rupeshwaranand Ashram family. Your spiritual journey with us begins today, and we pray it brings you immense peace, clarity, and divine grace.
      </p>

      <p style="color: #1f2937; font-size: 15px; font-weight: 600; margin: 0 0 16px;">Begin exploring:</p>

      <!-- Quick Links -->
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 28px;">
        <tr>
          <td style="padding: 0 0 12px;">
            <a href="${this.baseUrl}/products" style="text-decoration: none; display: block;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="background-color: #FFF7ED; border: 1px solid #FDBA74; border-radius: 8px; padding: 16px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="width: 36px; font-size: 20px; vertical-align: top;">&#128218;</td>
                        <td>
                          <p style="color: #C2410C; font-size: 15px; font-weight: 600; margin: 0 0 2px;">Browse Products</p>
                          <p style="color: #9A3412; font-size: 13px; margin: 0;">Sacred items, books, and spiritual essentials</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 0 0 12px;">
            <a href="${this.baseUrl}/teachings" style="text-decoration: none; display: block;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="background-color: #FFF7ED; border: 1px solid #FDBA74; border-radius: 8px; padding: 16px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="width: 36px; font-size: 20px; vertical-align: top;">&#127774;</td>
                        <td>
                          <p style="color: #C2410C; font-size: 15px; font-weight: 600; margin: 0 0 2px;">Explore Teachings</p>
                          <p style="color: #9A3412; font-size: 13px; margin: 0;">Discourses, wisdom, and guided meditations</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 0;">
            <a href="${this.baseUrl}/plans" style="text-decoration: none; display: block;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="background-color: #FFF7ED; border: 1px solid #FDBA74; border-radius: 8px; padding: 16px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="width: 36px; font-size: 20px; vertical-align: top;">&#11088;</td>
                        <td>
                          <p style="color: #C2410C; font-size: 15px; font-weight: 600; margin: 0 0 2px;">Subscribe to Plans</p>
                          <p style="color: #9A3412; font-size: 13px; margin: 0;">Exclusive spiritual content and blessings</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </a>
          </td>
        </tr>
      </table>

      ${this.ctaButton('Explore Our Offerings', this.baseUrl)}

      <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 24px 0 0; line-height: 1.6; font-style: italic;">
        "The journey of a thousand miles begins with a single step."<br>
        May your path be illuminated with divine light.
      </p>
    `;

    return this.emailShell('Welcome', 'Welcome!', 'Swami Rupeshwaranand ji', bodyHtml);
  }

  private generateInviteEmailTemplate(
    name: string,
    role: string,
    temporaryPassword: string,
    loginUrl: string,
  ): string {
    const bodyHtml = `
      <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 22px;">Welcome, ${name}!</h2>

      <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
        You have been invited to join the Swami Rupeshwaranand Ashram portal as a <strong>${role}</strong>.
      </p>

      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
        <tr>
          <td style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; border-radius: 0 8px 8px 0;">
            <p style="color: #92400E; font-size: 13px; font-weight: 600; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px;">Your Temporary Password</p>
            <p style="color: #1f2937; font-size: 24px; font-weight: 700; margin: 0; font-family: monospace; letter-spacing: 2px;">
              ${temporaryPassword}
            </p>
          </td>
        </tr>
      </table>

      <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        Please use your email address and this temporary password to log in. You will be prompted to set a new password after your first login.
      </p>

      ${this.ctaButton('Login to Portal', loginUrl)}

      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 24px 0 0;">
        <tr>
          <td style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 14px; border-radius: 0 8px 8px 0;">
            <p style="color: #991B1B; font-size: 13px; margin: 0; line-height: 1.5;">
              This password will expire in 7 days. Please log in and set your own password as soon as possible.
            </p>
          </td>
        </tr>
      </table>
    `;

    return this.emailShell('Admin Invitation', 'Admin Portal Invitation', 'Swami Rupeshwaranand ji', bodyHtml);
  }
}
