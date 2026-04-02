import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Razorpay = require('razorpay');
import { DatabaseService, DATABASE_SERVICE } from '@/common/database';
import { EmailService } from '@/common/email/email.service';
import { CartService } from '@/modules/cart/cart.service';
import { SettingsService } from '@/modules/settings/settings.service';
import {
  OrderStatus,
  CheckoutResponseDto,
  VerifyProductOrderPaymentDto,
  OrderPaymentVerificationResponseDto,
  UpdateOrderStatusDto,
  OrderResponseDto,
} from './dto';

// ============================================
// DynamoDB Order Entity (single-table design)
// ============================================
interface OrderItemSnapshot {
  productId: string;
  title: string;
  titleHi?: string;
  slug: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  subtotal: number;
}

interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

interface OrderEntity {
  PK: string;           // ORDER#<orderId>
  SK: string;           // ORDER#<orderId>
  GSI1PK: string;       // ORDER
  GSI1SK: string;       // DATE#<createdAt>
  GSI2PK: string;       // USER#<userId>
  GSI2SK: string;       // ORDER#<createdAt>
  id: string;
  userId: string;
  userEmail: string;
  status: OrderStatus;
  items: OrderItemSnapshot[];
  totalItems: number;
  totalAmount: number;
  currency: string;
  shippingAddress: ShippingAddress;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentStatus: 'created' | 'authorized' | 'captured' | 'failed';
  paymentMethod?: string;
  trackingNumber?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly orderEntityType = 'ORDER';

  // Razorpay instance and keys — lazily initialized from SettingsService
  private razorpay: any = null;
  private keyId = '';
  private keySecret = '';
  private razorpayInitializedAt = 0;
  private readonly RAZORPAY_REINIT_INTERVAL_MS = 5 * 60 * 1000; // 5 min

  constructor(
    @Inject(DATABASE_SERVICE)
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly cartService: CartService,
    private readonly settingsService: SettingsService,
  ) {
    // Eager init from env vars for immediate availability (cold start)
    this.keyId = this.configService.get<string>('RAZORPAY_KEY_ID', '');
    this.keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET', '');

    if (this.keyId && this.keySecret) {
      try {
        this.razorpay = new Razorpay({
          key_id: this.keyId,
          key_secret: this.keySecret,
        });
        this.razorpayInitializedAt = Date.now();
        this.logger.log('Razorpay initialized for Orders from env vars');
      } catch (error) {
        this.logger.warn('Failed to initialize Razorpay for Orders:', error.message);
      }
    }
  }

  /**
   * Ensures Razorpay is initialized. Re-reads from SettingsService periodically
   * to pick up admin-updated keys without a deployment.
   */
  private async ensureRazorpayInitialized(): Promise<void> {
    const needsReinit =
      !this.razorpay ||
      Date.now() - this.razorpayInitializedAt > this.RAZORPAY_REINIT_INTERVAL_MS;

    if (needsReinit) {
      try {
        const config = await this.settingsService.getRazorpayConfig();
        if (config.keyId && config.keySecret) {
          if (config.keyId !== this.keyId || config.keySecret !== this.keySecret) {
            this.razorpay = new Razorpay({
              key_id: config.keyId,
              key_secret: config.keySecret,
            });
            this.keyId = config.keyId;
            this.keySecret = config.keySecret;
            this.logger.log('Razorpay re-initialized for Orders with updated keys');
          }
          this.razorpayInitializedAt = Date.now();
        }
      } catch (error) {
        this.logger.warn(`Failed to refresh Razorpay keys for Orders: ${error.message}`);
      }
    }

    if (!this.razorpay) {
      throw new BadRequestException(
        'Payment service is not configured. Please set Razorpay keys in Admin Settings.',
      );
    }
  }

  // ============================================
  // Checkout: Create Order + Razorpay Order
  // ============================================

  async checkout(
    userId: string,
    userEmail: string,
  ): Promise<CheckoutResponseDto> {
    await this.ensureRazorpayInitialized();

    // 1. Fetch cart
    const cart = await this.cartService.getCart(userId);
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty. Add items before checkout.');
    }

    // 2. Fetch address
    const address = await this.cartService.getAddress(userId);
    if (!address) {
      throw new BadRequestException('Shipping address is required. Please add an address first.');
    }

    // 3. Snapshot cart items
    const items: OrderItemSnapshot[] = cart.items.map((item) => ({
      productId: item.productId,
      title: item.title,
      titleHi: item.titleHi,
      slug: item.slug,
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.imageUrl,
      subtotal: item.price * item.quantity,
    }));

    const totalAmount = items.reduce((sum, i) => sum + i.subtotal, 0);
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

    // 4. Create Order entity
    const orderId = uuidv4();
    const now = new Date().toISOString();

    const order: OrderEntity = {
      PK: `ORDER#${orderId}`,
      SK: `ORDER#${orderId}`,
      GSI1PK: this.orderEntityType,
      GSI1SK: `DATE#${now}`,
      GSI2PK: `USER#${userId}`,
      GSI2SK: `ORDER#${now}`,
      id: orderId,
      userId,
      userEmail,
      status: OrderStatus.PAYMENT_PENDING,
      items,
      totalItems,
      totalAmount,
      currency: 'INR',
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country,
      },
      paymentStatus: 'created',
      createdAt: now,
      updatedAt: now,
    };

    await this.db.put(order);
    this.logger.log(`Order created: ${orderId} for user ${userId}, amount ₹${totalAmount}`);

    // 5. Create Razorpay Order (amount in paise)
    try {
      const rzpOrder = await this.razorpay.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: 'INR',
        receipt: `ord_${orderId.substring(0, 8)}`,
        notes: {
          orderId,
          userId,
          userEmail,
          type: 'product_order',
        },
      });

      // 6. Update order with Razorpay order ID
      await this.db.update(this.orderEntityType, {
        key: { PK: `ORDER#${orderId}`, SK: `ORDER#${orderId}` },
        updateExpression: 'SET razorpayOrderId = :rzpOid, updatedAt = :now',
        expressionAttributeValues: {
          ':rzpOid': rzpOrder.id,
          ':now': new Date().toISOString(),
        },
      });

      return {
        orderId,
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        razorpayKeyId: this.keyId,
      };
    } catch (error) {
      this.logger.error(`Failed to create Razorpay order for ${orderId}:`, error.message);
      // Mark order as failed
      await this.db.update(this.orderEntityType, {
        key: { PK: `ORDER#${orderId}`, SK: `ORDER#${orderId}` },
        updateExpression: 'SET #st = :st, paymentStatus = :ps, updatedAt = :now',
        expressionAttributeNames: { '#st': 'status' },
        expressionAttributeValues: {
          ':st': OrderStatus.CANCELLED,
          ':ps': 'failed',
          ':now': new Date().toISOString(),
        },
      });
      throw new InternalServerErrorException('Failed to initiate payment. Please try again.');
    }
  }

  // ============================================
  // Verify Payment
  // ============================================

  async verifyPayment(
    dto: VerifyProductOrderPaymentDto,
    userId: string,
  ): Promise<OrderPaymentVerificationResponseDto> {
    // 1. Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== dto.razorpaySignature) {
      this.logger.warn(`Payment signature mismatch for order ${dto.orderId}`);
      throw new BadRequestException('Payment verification failed. Invalid signature.');
    }

    // 2. Fetch order
    const order = await this.db.get<OrderEntity>(
      `ORDER#${dto.orderId}`,
      `ORDER#${dto.orderId}`,
    );

    if (!order) {
      throw new NotFoundException(`Order ${dto.orderId} not found`);
    }

    if (order.userId !== userId) {
      throw new BadRequestException('Order does not belong to this user');
    }

    if (order.status === OrderStatus.PAID) {
      return {
        success: true,
        message: 'Order already confirmed',
        orderId: order.id,
        status: order.status,
      };
    }

    // 3. Mark order as paid
    const now = new Date().toISOString();
    await this.db.update(this.orderEntityType, {
      key: { PK: `ORDER#${dto.orderId}`, SK: `ORDER#${dto.orderId}` },
      updateExpression:
        'SET #st = :st, paymentStatus = :ps, razorpayPaymentId = :rpid, updatedAt = :now',
      expressionAttributeNames: { '#st': 'status' },
      expressionAttributeValues: {
        ':st': OrderStatus.PAID,
        ':ps': 'captured',
        ':rpid': dto.razorpayPaymentId,
        ':now': now,
      },
    });

    this.logger.log(`Order ${dto.orderId} payment verified. RazorpayPaymentId: ${dto.razorpayPaymentId}`);

    // 4. Clear cart
    try {
      await this.cartService.clearCart(userId);
      this.logger.log(`Cart cleared for user ${userId} after order ${dto.orderId}`);
    } catch (error) {
      this.logger.warn(`Failed to clear cart for user ${userId}:`, error.message);
    }

    // 5. Send confirmation email (non-blocking)
    this.sendOrderConfirmationEmail(order, dto.razorpayPaymentId).catch((err) =>
      this.logger.warn(`Failed to send order confirmation email: ${err.message}`),
    );

    return {
      success: true,
      message: 'Payment verified. Order confirmed!',
      orderId: order.id,
      status: OrderStatus.PAID,
    };
  }

  /**
   * Called by Razorpay webhook (payment.captured) — no client-side signature needed.
   * Webhook signature is already verified by the payment module.
   */
  async confirmOrderFromWebhook(orderId: string, razorpayPaymentId: string): Promise<void> {
    const order = await this.db.get<OrderEntity>(
      `ORDER#${orderId}`,
      `ORDER#${orderId}`,
    );

    if (!order) {
      this.logger.warn(`Webhook: Order ${orderId} not found`);
      return;
    }

    if (order.status === OrderStatus.PAID) {
      this.logger.log(`Webhook: Order ${orderId} already marked as paid`);
      return;
    }

    const now = new Date().toISOString();
    await this.db.update(this.orderEntityType, {
      key: { PK: `ORDER#${orderId}`, SK: `ORDER#${orderId}` },
      updateExpression:
        'SET #st = :st, paymentStatus = :ps, razorpayPaymentId = :rpid, updatedAt = :now',
      expressionAttributeNames: { '#st': 'status' },
      expressionAttributeValues: {
        ':st': OrderStatus.PAID,
        ':ps': 'captured',
        ':rpid': razorpayPaymentId,
        ':now': now,
      },
    });

    this.logger.log(`Webhook: Order ${orderId} confirmed. Payment: ${razorpayPaymentId}`);

    // Clear cart
    try {
      await this.cartService.clearCart(order.userId);
    } catch (error) {
      this.logger.warn(`Webhook: Failed to clear cart for user ${order.userId}: ${error.message}`);
    }

    // Send confirmation email (non-blocking)
    this.sendOrderConfirmationEmail(order, razorpayPaymentId).catch((err) =>
      this.logger.warn(`Webhook: Failed to send order email: ${err.message}`),
    );
  }

  // ============================================
  // Order Queries
  // ============================================

  async getOrderById(orderId: string): Promise<OrderResponseDto | null> {
    const order = await this.db.get<OrderEntity>(
      `ORDER#${orderId}`,
      `ORDER#${orderId}`,
    );
    return order ? this.toResponseDto(order) : null;
  }

  async getOrdersByUser(userId: string): Promise<OrderResponseDto[]> {
    const result = await this.db.query<OrderEntity>(this.orderEntityType, {
      indexName: 'GSI2',
      keyConditionExpression: 'GSI2PK = :pk AND begins_with(GSI2SK, :skPrefix)',
      expressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':skPrefix': 'ORDER#',
      },
    });

    return result.items
      .map((o) => this.toResponseDto(o))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAllOrders(): Promise<OrderResponseDto[]> {
    const result = await this.db.query<OrderEntity>(this.orderEntityType, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      expressionAttributeValues: {
        ':pk': this.orderEntityType,
      },
    });

    return result.items
      .map((o) => this.toResponseDto(o))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateOrderStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    const order = await this.db.get<OrderEntity>(
      `ORDER#${orderId}`,
      `ORDER#${orderId}`,
    );

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const now = new Date().toISOString();
    let updateExpression = 'SET #st = :st, updatedAt = :now';
    const expressionAttributeNames: Record<string, string> = { '#st': 'status' };
    const expressionAttributeValues: Record<string, any> = {
      ':st': dto.status,
      ':now': now,
    };

    if (dto.adminNotes) {
      updateExpression += ', adminNotes = :notes';
      expressionAttributeValues[':notes'] = dto.adminNotes;
    }

    if (dto.trackingNumber) {
      updateExpression += ', trackingNumber = :tracking';
      expressionAttributeValues[':tracking'] = dto.trackingNumber;
    }

    await this.db.update(this.orderEntityType, {
      key: { PK: `ORDER#${orderId}`, SK: `ORDER#${orderId}` },
      updateExpression,
      expressionAttributeNames,
      expressionAttributeValues,
    });

    const updated = await this.db.get<OrderEntity>(
      `ORDER#${orderId}`,
      `ORDER#${orderId}`,
    );

    // Send status update email (non-blocking)
    this.sendOrderStatusUpdateEmail(updated!, dto.status, dto.trackingNumber).catch((err) =>
      this.logger.warn(`Failed to send order status update email: ${err.message}`),
    );

    return this.toResponseDto(updated!);
  }

  // ============================================
  // Email
  // ============================================

  private async sendOrderConfirmationEmail(
    order: OrderEntity,
    razorpayPaymentId: string,
  ): Promise<void> {
    const itemsHtml = order.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          ${item.title}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          ₹${item.price}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
          ₹${item.subtotal}
        </td>
      </tr>`,
      )
      .join('');

    const addr = order.shippingAddress;
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🙏 Order Confirmed!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Swami Rupeshwaranand Ashram</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px;">Dear ${addr.fullName},</h2>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">
                Thank you for your order! Your purchase has been confirmed.
              </p>

              <!-- Order ID -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; border: 2px solid #f59e0b;">
                <p style="color: #92400e; font-size: 14px; margin: 0 0 5px;">Order ID</p>
                <span style="font-size: 18px; font-weight: 700; color: #92400e; font-family: monospace;">${order.id.substring(0, 8).toUpperCase()}</span>
              </div>

              <!-- Items Table -->
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: left; color: #6b7280; font-size: 14px;">Product</th>
                    <th style="padding: 12px; text-align: center; color: #6b7280; font-size: 14px;">Qty</th>
                    <th style="padding: 12px; text-align: right; color: #6b7280; font-size: 14px;">Price</th>
                    <th style="padding: 12px; text-align: right; color: #6b7280; font-size: 14px;">Subtotal</th>
                  </tr>
                </thead>
                <tbody style="color: #4b5563; font-size: 14px;">
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="padding: 15px 12px; text-align: right; font-weight: 700; font-size: 16px; color: #1f2937;">Total</td>
                    <td style="padding: 15px 12px; text-align: right; font-weight: 700; font-size: 18px; color: #ea580c;">₹${order.totalAmount}</td>
                  </tr>
                </tfoot>
              </table>

              <!-- Shipping Address -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 10px;">📦 Shipping Address</h3>
                <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0;">
                  ${addr.fullName}<br>
                  ${addr.addressLine1}${addr.addressLine2 ? '<br>' + addr.addressLine2 : ''}<br>
                  ${addr.city}, ${addr.state} - ${addr.pincode}<br>
                  ${addr.country}<br>
                  📞 ${addr.phone}
                </p>
              </div>

              <!-- Payment Info -->
              <p style="color: #6b7280; font-size: 13px; margin: 20px 0 0;">
                Payment ID: ${razorpayPaymentId}<br>
                Payment Status: ✅ Captured
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
</html>`.trim();

    const text = `
Order Confirmed!

Dear ${addr.fullName},

Thank you for your order! Your purchase has been confirmed.

Order ID: ${order.id.substring(0, 8).toUpperCase()}
Items: ${order.items.map((i) => `${i.title} × ${i.quantity} = ₹${i.subtotal}`).join(', ')}
Total: ₹${order.totalAmount}

Shipping to: ${addr.fullName}, ${addr.addressLine1}, ${addr.city}, ${addr.state} - ${addr.pincode}
Phone: ${addr.phone}

Payment ID: ${razorpayPaymentId}

With divine blessings,
Swami Rupeshwaranand Ashram
    `.trim();

    await this.emailService.sendEmail({
      to: order.userEmail,
      toName: addr.fullName,
      subject: `Order Confirmed! #${order.id.substring(0, 8).toUpperCase()} — Swami Rupeshwaranand Ashram`,
      text,
      html,
    });

    this.logger.log(`Order confirmation email sent to ${order.userEmail} for order ${order.id}`);
  }

  private async sendOrderStatusUpdateEmail(
    order: OrderEntity,
    newStatus: string,
    trackingNumber?: string,
  ): Promise<void> {
    const statusTextMap: Record<string, string> = {
      processing: 'Being Prepared',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };

    const statusText = statusTextMap[newStatus];
    if (!statusText) {
      return; // Only send emails for the statuses above
    }

    const statusMessageMap: Record<string, string> = {
      processing: `Your order #${order.id.substring(0, 8).toUpperCase()} is being prepared! We're working on getting your items ready.`,
      shipped: `Your order #${order.id.substring(0, 8).toUpperCase()} has been shipped! Tracking: ${trackingNumber || 'N/A'}. Expected delivery in 3-7 business days.`,
      delivered: `Your order #${order.id.substring(0, 8).toUpperCase()} has been delivered! We hope you enjoy your purchase.`,
      cancelled: `Your order #${order.id.substring(0, 8).toUpperCase()} has been cancelled. If payment was made, a refund will be processed.`,
    };

    const statusEmojiMap: Record<string, string> = {
      processing: '🔧',
      shipped: '🚚',
      delivered: '✅',
      cancelled: '❌',
    };

    const statusColorMap: Record<string, string> = {
      processing: '#2563eb',
      shipped: '#7c3aed',
      delivered: '#16a34a',
      cancelled: '#dc2626',
    };

    const orderIdShort = order.id.substring(0, 8).toUpperCase();
    const addr = order.shippingAddress;
    const message = statusMessageMap[newStatus];
    const emoji = statusEmojiMap[newStatus];
    const statusColor = statusColorMap[newStatus];

    const subject = `Order Update: #${orderIdShort} — ${statusText} — Swami Rupeshwaranand Ashram`;

    const trackingSection =
      newStatus === 'shipped' && trackingNumber
        ? `
              <div style="background-color: #f0fdf4; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #bbf7d0;">
                <p style="color: #166534; font-size: 14px; margin: 0;"><strong>📦 Tracking Number:</strong> ${trackingNumber}</p>
                <p style="color: #166534; font-size: 13px; margin: 8px 0 0;">Expected delivery in 3-7 business days.</p>
              </div>`
        : '';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Status Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">${emoji} Order ${statusText}</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Swami Rupeshwaranand Ashram</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px;">Dear ${addr.fullName},</h2>

              <!-- Status Badge -->
              <div style="text-align: center; margin: 20px 0;">
                <span style="display: inline-block; background-color: ${statusColor}; color: #ffffff; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 600; text-transform: uppercase;">${statusText}</span>
              </div>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 10px; text-align: center;">
                ${message}
              </p>

              <!-- Order ID -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; border: 2px solid #f59e0b;">
                <p style="color: #92400e; font-size: 14px; margin: 0 0 5px;">Order ID</p>
                <span style="font-size: 18px; font-weight: 700; color: #92400e; font-family: monospace;">${orderIdShort}</span>
              </div>
              ${trackingSection}

              <!-- Order Summary -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 10px;">Order Summary</h3>
                <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0;">
                  Items: ${order.totalItems}<br>
                  Total: <strong>₹${order.totalAmount}</strong>
                </p>
              </div>

              <!-- Shipping Address -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 10px;">📦 Shipping Address</h3>
                <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0;">
                  ${addr.fullName}<br>
                  ${addr.addressLine1}${addr.addressLine2 ? '<br>' + addr.addressLine2 : ''}<br>
                  ${addr.city}, ${addr.state} - ${addr.pincode}<br>
                  ${addr.country}
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
</html>`.trim();

    const trackingText =
      newStatus === 'shipped' && trackingNumber
        ? `\nTracking Number: ${trackingNumber}\nExpected delivery in 3-7 business days.`
        : '';

    const text = `
Order ${statusText}

Dear ${addr.fullName},

${message}

Order ID: ${orderIdShort}
Items: ${order.totalItems}
Total: ₹${order.totalAmount}
${trackingText}

Shipping Address:
${addr.fullName}
${addr.addressLine1}${addr.addressLine2 ? '\n' + addr.addressLine2 : ''}
${addr.city}, ${addr.state} - ${addr.pincode}
${addr.country}

With divine blessings,
Swami Rupeshwaranand Ashram
    `.trim();

    await this.emailService.sendEmail({
      to: order.userEmail,
      toName: addr.fullName,
      subject,
      text,
      html,
    });

    this.logger.log(`Order status update email (${newStatus}) sent to ${order.userEmail} for order ${order.id}`);
  }

  // ============================================
  // Stats / Analytics
  // ============================================

  async getStats() {
    const result = await this.db.query<OrderEntity>(this.orderEntityType, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      expressionAttributeValues: {
        ':pk': this.orderEntityType,
      },
    });

    const orders = result.items;
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter((o) => o.status !== OrderStatus.CANCELLED)
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const thisMonthOrders = orders.filter(
      (o) => new Date(o.createdAt) >= thisMonthStart && o.status !== OrderStatus.CANCELLED,
    );
    const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const lastMonthOrders = orders.filter(
      (o) => {
        const d = new Date(o.createdAt);
        return d >= lastMonthStart && d <= lastMonthEnd && o.status !== OrderStatus.CANCELLED;
      },
    );
    const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const nonCancelledOrders = orders.filter((o) => o.status !== OrderStatus.CANCELLED);
    const averageOrderValue =
      nonCancelledOrders.length > 0
        ? Math.round((totalRevenue / nonCancelledOrders.length) * 100) / 100
        : 0;

    // Orders by status
    const ordersByStatus: Record<string, number> = {};
    for (const order of orders) {
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    }

    // Top 5 products by quantity sold
    const productQuantities: Record<string, { title: string; quantity: number; revenue: number }> = {};
    for (const order of nonCancelledOrders) {
      for (const item of order.items) {
        if (!productQuantities[item.productId]) {
          productQuantities[item.productId] = { title: item.title, quantity: 0, revenue: 0 };
        }
        productQuantities[item.productId].quantity += item.quantity;
        productQuantities[item.productId].revenue += item.subtotal;
      }
    }
    const topProducts = Object.entries(productQuantities)
      .map(([productId, data]) => ({ productId, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Recent 5 orders
    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((o) => this.toResponseDto(o));

    // Monthly revenue for last 6 months
    const monthlyRevenue: { month: string; revenue: number; orders: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const monthLabel = mStart.toLocaleString('en-US', { year: 'numeric', month: 'short' });

      const monthOrders = orders.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= mStart && d <= mEnd && o.status !== OrderStatus.CANCELLED;
      });

      monthlyRevenue.push({
        month: monthLabel,
        revenue: monthOrders.reduce((sum, o) => sum + o.totalAmount, 0),
        orders: monthOrders.length,
      });
    }

    return {
      totalOrders,
      totalRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      averageOrderValue,
      ordersByStatus,
      topProducts,
      recentOrders,
      monthlyRevenue,
    };
  }

  // ============================================
  // Helpers
  // ============================================

  private toResponseDto(order: OrderEntity): OrderResponseDto {
    return {
      id: order.id,
      userId: order.userId,
      userEmail: order.userEmail,
      status: order.status,
      items: order.items,
      totalItems: order.totalItems,
      totalAmount: order.totalAmount,
      currency: order.currency,
      shippingAddress: order.shippingAddress,
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
      paymentStatus: order.paymentStatus,
      trackingNumber: order.trackingNumber,
      adminNotes: order.adminNotes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
