import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Razorpay = require('razorpay');
import { DatabaseService, DATABASE_SERVICE } from '@/common/database';
import { SubscriptionsService } from '@/modules/subscriptions/subscriptions.service';
import { OrdersService } from '@/modules/orders/orders.service';
import { EmailService } from '@/common/email/email.service';
import { SettingsService } from '@/modules/settings/settings.service';
import {
  InitiateSubscriptionPaymentDto,
  VerifyOrderPaymentDto,
  VerifySubscriptionPaymentDto,
  InitiateDonationPaymentDto,
  VerifyDonationPaymentDto,
  InitiateYagyaPaymentDto,
  VerifyYagyaPaymentDto,
  SubscriptionPaymentResponseDto,
  DonationPaymentResponseDto,
  YagyaPaymentResponseDto,
  PaymentVerificationResponseDto,
} from './dto';
import { PaymentMethod, SubscriptionStatus, BillingCycle } from '@/modules/subscriptions/dto';

// ============================================
// Payment Record Entity (stored in DynamoDB)
// ============================================
interface PaymentRecordEntity {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  GSI2PK?: string;
  GSI2SK?: string;
  id: string;
  type: 'subscription' | 'donation' | 'yagya';
  userId?: string;
  userEmail?: string;
  entityId: string; // subscriptionId, donationId, or yagya bookingId
  razorpayOrderId?: string;
  razorpaySubscriptionId?: string;
  razorpayPaymentId?: string;
  razorpayPlanId?: string;
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'failed' | 'refunded';
  failureReason?: string;
  errorCode?: string;
  method?: string; // upi, card, netbanking, etc.
  name?: string;
  phone?: string;
  category?: string;
  tier?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly paymentEntityType = 'PAYMENT';

  // Razorpay instance and keys — lazily initialized from SettingsService
  private razorpay: any = null;
  private keyId = '';
  private keySecret = '';
  private webhookSecret = '';
  private razorpayInitializedAt = 0;
  private readonly RAZORPAY_REINIT_INTERVAL_MS = 5 * 60 * 1000; // 5 min

  constructor(
    @Inject(DATABASE_SERVICE)
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
    private readonly subscriptionsService: SubscriptionsService,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
    private readonly emailService: EmailService,
    private readonly settingsService: SettingsService,
  ) {
    // Eager init from env vars for immediate availability (cold start)
    this.keyId = this.configService.get<string>('RAZORPAY_KEY_ID', '');
    this.keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET', '');
    this.webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET', '');

    if (this.keyId && this.keySecret) {
      try {
        this.razorpay = new Razorpay({
          key_id: this.keyId,
          key_secret: this.keySecret,
        });
        this.razorpayInitializedAt = Date.now();
        this.logger.log('Razorpay initialized from env vars');
      } catch (error) {
        this.logger.warn('Failed to initialize Razorpay:', error.message);
      }
    } else {
      this.logger.warn(
        'Razorpay keys not in env vars. Will try loading from Settings on first use.',
      );
    }
  }

  /**
   * Ensures Razorpay is initialized before any payment operation.
   * Re-initializes from SettingsService if keys may have changed (every 5 min).
   */
  private async ensureRazorpayInitialized(): Promise<void> {
    const needsReinit =
      !this.razorpay || Date.now() - this.razorpayInitializedAt > this.RAZORPAY_REINIT_INTERVAL_MS;

    if (needsReinit) {
      await this.refreshRazorpayKeys();
    }

    if (!this.razorpay) {
      throw new BadRequestException(
        'Payment service is not configured. Please set Razorpay keys in Admin Settings.',
      );
    }
  }

  /**
   * Reload Razorpay keys from SettingsService (DynamoDB → env fallback).
   * Called periodically to pick up admin-updated keys without restart.
   */
  private async refreshRazorpayKeys(): Promise<void> {
    try {
      const config = await this.settingsService.getRazorpayConfig();

      // Only re-init if keys actually changed
      if (config.keyId && config.keySecret) {
        if (config.keyId !== this.keyId || config.keySecret !== this.keySecret) {
          this.razorpay = new Razorpay({
            key_id: config.keyId,
            key_secret: config.keySecret,
          });
          this.keyId = config.keyId;
          this.keySecret = config.keySecret;
          this.logger.log('Razorpay re-initialized with updated keys from Settings');
        }

        if (config.webhookSecret) {
          this.webhookSecret = config.webhookSecret;
        }

        this.razorpayInitializedAt = Date.now();
      }
    } catch (error) {
      this.logger.warn(`Failed to refresh Razorpay keys from Settings: ${error.message}`);
      // Keep using existing keys if refresh fails
    }
  }

  // ============================================
  // Subscription Payment - Initiate
  // ============================================

  /**
   * Initiates a payment flow for a subscription plan.
   *
   * For autopay plans (Free/300/1100/2100):
   *   - Creates a Razorpay Plan (if not exists) and Razorpay Subscription
   *   - Returns razorpaySubscriptionId for frontend to open subscription checkout
   *
   * For manual/one-time plans (5100/21000):
   *   - Creates a Razorpay Order
   *   - Returns razorpayOrderId for frontend to open standard checkout
   */
  async initiateSubscriptionPayment(
    dto: InitiateSubscriptionPaymentDto,
    userId: string,
    userEmail: string,
  ): Promise<SubscriptionPaymentResponseDto> {
    // 1. Fetch the plan
    const plan = await this.subscriptionsService.findPlanById(dto.planId);
    if (!plan) {
      throw new BadRequestException('Subscription plan not found');
    }

    if (!plan.isActive) {
      throw new BadRequestException('This plan is currently not available');
    }

    // 2. Free plan - just activate directly
    if (plan.price === 0) {
      const subscription = await this.subscriptionsService.createUserSubscription(
        { userId, planId: plan.id, paymentMethod: PaymentMethod.FREE },
        userEmail,
      );
      return {
        subscriptionId: subscription.id,
        amount: 0,
        currency: 'INR',
        razorpayKeyId: this.keyId,
        planName: plan.name,
        planDescription: plan.description,
        isAutopay: false,
        notes: { message: 'Free plan activated successfully' },
      };
    }

    // 3. Create internal subscription with payment_pending status
    const subscription = await this.subscriptionsService.createUserSubscription(
      {
        userId,
        planId: plan.id,
        paymentMethod: plan.autopayEnabled ? PaymentMethod.UPI_AUTOPAY : PaymentMethod.RAZORPAY,
      },
      userEmail,
    );

    try {
      // 4. Determine flow based on plan type
      if (plan.autopayEnabled && plan.price <= 2100) {
        // ===== AUTOPAY FLOW (Razorpay Subscriptions API) =====
        return await this.createRazorpaySubscription(plan, subscription.id, userId, userEmail);
      } else {
        // ===== ONE-TIME FLOW (Razorpay Orders API) =====
        return await this.createRazorpayOrder(plan, subscription.id, userId, userEmail);
      }
    } catch (error) {
      this.logger.error('Failed to initiate payment with Razorpay', error);
      // Mark subscription as failed
      await this.subscriptionsService.updateUserSubscription(subscription.id, {
        status: SubscriptionStatus.PAYMENT_FAILED,
        adminNotes: `Payment initiation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      throw new InternalServerErrorException('Failed to initiate payment. Please try again.');
    }
  }

  /**
   * Creates a Razorpay Subscription for autopay plans.
   * Uses Razorpay Plans + Subscriptions API.
   */
  private async createRazorpaySubscription(
    plan: any,
    subscriptionId: string,
    userId: string,
    userEmail: string,
  ): Promise<SubscriptionPaymentResponseDto> {
    // Map billing cycle to Razorpay period
    type RazorpayPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
    const periodMap: Record<string, { period: RazorpayPeriod; interval: number }> = {
      [BillingCycle.WEEKLY]: { period: 'weekly', interval: 1 },
      [BillingCycle.MONTHLY]: { period: 'monthly', interval: 1 },
      [BillingCycle.QUARTERLY]: { period: 'monthly', interval: 3 },
      [BillingCycle.HALF_YEARLY]: { period: 'monthly', interval: 6 },
      [BillingCycle.YEARLY]: { period: 'yearly', interval: 1 },
    };

    const billing = periodMap[plan.billingCycle] || {
      period: 'monthly' as RazorpayPeriod,
      interval: 1,
    };

    await this.ensureRazorpayInitialized();

    // Create a Razorpay Plan
    const razorpayPlan = (await this.razorpay.plans.create({
      period: billing.period,
      interval: billing.interval,
      item: {
        name: plan.name,
        amount: plan.price * 100, // Convert to paise
        currency: 'INR',
        description: plan.description || `${plan.name} Subscription`,
      },
    })) as any;

    this.logger.log(`Created Razorpay Plan: ${razorpayPlan.id} for plan: ${plan.name}`);

    // Create a Razorpay Subscription
    const razorpaySub = (await this.razorpay.subscriptions.create({
      plan_id: razorpayPlan.id,
      total_count: 120, // Max billing cycles (10 years monthly)
      quantity: 1,
      notes: {
        subscriptionId,
        userId,
        userEmail,
        planName: plan.name,
        planType: plan.planType,
      },
    })) as any;

    this.logger.log(`Created Razorpay Subscription: ${razorpaySub.id}`);

    // Store payment record
    await this.createPaymentRecord({
      type: 'subscription',
      userId,
      userEmail,
      entityId: subscriptionId,
      razorpaySubscriptionId: razorpaySub.id,
      razorpayPlanId: razorpayPlan.id,
      amount: plan.price * 100,
      currency: 'INR',
      status: 'created',
    });

    // Update subscription with razorpay subscription ID
    await this.subscriptionsService.updateUserSubscription(subscriptionId, {
      razorpaySubscriptionId: razorpaySub.id,
    });

    return {
      subscriptionId,
      razorpaySubscriptionId: razorpaySub.id,
      amount: plan.price * 100,
      currency: 'INR',
      razorpayKeyId: this.keyId,
      planName: plan.name,
      planDescription: plan.description || '',
      isAutopay: true,
      notes: {
        subscriptionId,
        planType: plan.planType,
      },
    };
  }

  /**
   * Creates a Razorpay Order for one-time payments (5100/21000 plans).
   */
  private async createRazorpayOrder(
    plan: any,
    subscriptionId: string,
    userId: string,
    userEmail: string,
  ): Promise<SubscriptionPaymentResponseDto> {
    await this.ensureRazorpayInitialized();

    const order = await this.razorpay.orders.create({
      amount: plan.price * 100, // Convert to paise
      currency: 'INR',
      receipt: `sub_${subscriptionId}`,
      notes: {
        subscriptionId,
        userId,
        userEmail,
        planName: plan.name,
        planType: plan.planType,
        type: 'subscription',
      },
    });

    this.logger.log(`Created Razorpay Order: ${order.id} for plan: ${plan.name}`);

    // Store payment record
    await this.createPaymentRecord({
      type: 'subscription',
      userId,
      userEmail,
      entityId: subscriptionId,
      razorpayOrderId: order.id,
      amount: plan.price * 100,
      currency: 'INR',
      status: 'created',
    });

    return {
      subscriptionId,
      razorpayOrderId: order.id,
      amount: plan.price * 100,
      currency: 'INR',
      razorpayKeyId: this.keyId,
      planName: plan.name,
      planDescription: plan.description || '',
      isAutopay: false,
      notes: {
        subscriptionId,
        planType: plan.planType,
      },
    };
  }

  // ============================================
  // Subscription Payment - Verify
  // ============================================

  /**
   * Verify a one-time order payment (for 5100/21000 plans)
   */
  async verifyOrderPayment(dto: VerifyOrderPaymentDto): Promise<PaymentVerificationResponseDto> {
    // Verify signature: order_id|payment_id
    const generatedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== dto.razorpaySignature) {
      this.logger.warn(`Payment verification failed for order: ${dto.razorpayOrderId}`);
      await this.recordPaymentFailure(
        dto.subscriptionId,
        'Signature verification failed',
        'SIGNATURE_MISMATCH',
      );
      throw new BadRequestException('Payment verification failed. Invalid signature.');
    }

    // Activate subscription
    await this.subscriptionsService.activateSubscription(dto.subscriptionId, dto.razorpayPaymentId);

    // Update payment record
    await this.updatePaymentByEntity(dto.subscriptionId, {
      razorpayPaymentId: dto.razorpayPaymentId,
      status: 'captured',
    });

    this.logger.log(`Payment verified and subscription activated: ${dto.subscriptionId}`);

    return {
      success: true,
      message: 'Payment verified successfully. Your subscription is now active!',
      entityId: dto.subscriptionId,
      status: 'active',
    };
  }

  /**
   * Verify an autopay subscription payment
   */
  async verifySubscriptionPayment(
    dto: VerifySubscriptionPaymentDto,
  ): Promise<PaymentVerificationResponseDto> {
    // Verify signature: payment_id|subscription_id
    const generatedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${dto.razorpayPaymentId}|${dto.razorpaySubscriptionId}`)
      .digest('hex');

    if (generatedSignature !== dto.razorpaySignature) {
      this.logger.warn(`Subscription payment verification failed: ${dto.razorpaySubscriptionId}`);
      await this.recordPaymentFailure(
        dto.subscriptionId,
        'Signature verification failed',
        'SIGNATURE_MISMATCH',
      );
      throw new BadRequestException('Payment verification failed. Invalid signature.');
    }

    // Activate subscription
    await this.subscriptionsService.activateSubscription(dto.subscriptionId, dto.razorpayPaymentId);

    // Update subscription with razorpay IDs
    await this.subscriptionsService.updateUserSubscription(dto.subscriptionId, {
      razorpaySubscriptionId: dto.razorpaySubscriptionId,
      razorpayPaymentId: dto.razorpayPaymentId,
    });

    // Update payment record
    await this.updatePaymentByEntity(dto.subscriptionId, {
      razorpayPaymentId: dto.razorpayPaymentId,
      status: 'captured',
    });

    this.logger.log(`Autopay subscription verified and activated: ${dto.subscriptionId}`);

    return {
      success: true,
      message: 'Subscription activated with autopay! You will be charged automatically.',
      entityId: dto.subscriptionId,
      status: 'active',
    };
  }

  // ============================================
  // Donation Payment
  // ============================================

  /**
   * Initiate a donation payment via Razorpay Orders
   */
  async initiateDonationPayment(
    dto: InitiateDonationPaymentDto,
    userId?: string,
  ): Promise<DonationPaymentResponseDto> {
    await this.ensureRazorpayInitialized();

    const order = await this.razorpay.orders.create({
      amount: dto.amount * 100,
      currency: 'INR',
      receipt: `don_${uuidv4().substring(0, 8)}`,
      notes: {
        purpose: dto.purpose,
        donorName: dto.donorName || '',
        donorEmail: dto.donorEmail || '',
        type: 'donation',
        ...(userId && { userId }),
      },
    });

    // Store in payment records
    const paymentId = uuidv4();
    await this.createPaymentRecord({
      type: 'donation',
      userId,
      userEmail: dto.donorEmail,
      entityId: paymentId, // Will be linked to donation later
      razorpayOrderId: order.id,
      amount: dto.amount * 100,
      currency: 'INR',
      status: 'created',
    });

    return {
      donationId: paymentId,
      razorpayOrderId: order.id,
      amount: dto.amount * 100,
      currency: 'INR',
      razorpayKeyId: this.keyId,
      notes: {
        purpose: dto.purpose,
        donorName: dto.donorName || '',
      },
    };
  }

  /**
   * Verify a donation payment
   */
  async verifyDonationPayment(
    dto: VerifyDonationPaymentDto,
  ): Promise<PaymentVerificationResponseDto> {
    const generatedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== dto.razorpaySignature) {
      this.logger.warn(`Donation payment verification failed for order: ${dto.razorpayOrderId}`);
      throw new BadRequestException('Payment verification failed.');
    }

    // Update payment record
    await this.updatePaymentByEntity(dto.donationId, {
      razorpayPaymentId: dto.razorpayPaymentId,
      status: 'captured',
    });

    return {
      success: true,
      message: 'Donation payment verified. Thank you for your generous contribution!',
      entityId: dto.donationId,
      status: 'completed',
    };
  }

  // ============================================
  // Yagya Payments (Sponsor / Yajaman / Shivirarthi)
  // ============================================

  /**
   * Determine which Razorpay account to use based on yagya category.
   * sponsor (CSR partners)          → Foundation account  (default)
   * food-stall, business-stall      → Spiritual account
   * shivirarthi, yajaman            → Ashram account
   * anything else / unknown         → Foundation account  (default)
   */
  private getYagyaAccountType(category: string): 'ashram' | 'foundation' | 'spiritual' {
    if (category === 'food-stall' || category === 'business-stall') return 'spiritual';
    if (category === 'shivirarthi' || category === 'yajaman') return 'ashram';
    return 'foundation'; // sponsor, unknown, default
  }

  /**
   * Initiate a yagya booking payment.
   * Uses the appropriate Razorpay account based on category.
   */
  async initiateYagyaPayment(dto: InitiateYagyaPaymentDto): Promise<YagyaPaymentResponseDto> {
    const accountType = this.getYagyaAccountType(dto.category);
    const config = await this.settingsService.getRazorpayConfigForAccount(accountType);

    const Razorpay = require('razorpay');
    const rzpInstance = new Razorpay({
      key_id: config.keyId,
      key_secret: config.keySecret,
    });

    const bookingId = uuidv4();
    const order = await rzpInstance.orders.create({
      amount: dto.amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `yagya_${bookingId.substring(0, 8)}`,
      notes: {
        type: 'yagya',
        category: dto.category,
        tierId: dto.tierId,
        name: dto.name,
        email: dto.email || '',
        phone: dto.phone || '',
        company: dto.company || '',
        accountType,
      },
    });

    // Store payment record
    await this.createPaymentRecord({
      type: 'yagya',
      userEmail: dto.email,
      entityId: bookingId,
      razorpayOrderId: order.id,
      amount: dto.amount * 100,
      currency: 'INR',
      status: 'created',
      name: dto.name,
      phone: dto.phone,
      category: dto.category,
      tier: dto.tierId,
    });

    return {
      bookingId,
      razorpayOrderId: order.id,
      amount: dto.amount * 100,
      currency: 'INR',
      razorpayKeyId: config.keyId,
      notes: {
        category: dto.category,
        tierId: dto.tierId,
        name: dto.name,
      },
    };
  }

  /**
   * Verify a yagya booking payment.
   * Uses the correct Razorpay key_secret based on category.
   */
  async verifyYagyaPayment(dto: VerifyYagyaPaymentDto): Promise<PaymentVerificationResponseDto> {
    const accountType = this.getYagyaAccountType(dto.category);
    const config = await this.settingsService.getRazorpayConfigForAccount(accountType);

    const generatedSignature = crypto
      .createHmac('sha256', config.keySecret)
      .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== dto.razorpaySignature) {
      this.logger.warn(`Yagya payment verification failed for order: ${dto.razorpayOrderId}`);
      throw new BadRequestException('Payment verification failed.');
    }

    await this.updatePaymentByEntity(dto.bookingId, {
      razorpayPaymentId: dto.razorpayPaymentId,
      status: 'captured',
    });

    return {
      success: true,
      message: 'Yagya booking payment verified successfully!',
      entityId: dto.bookingId,
      status: 'completed',
    };
  }

  // ============================================
  // Webhook Handler
  // ============================================

  /**
   * Handle Razorpay webhook events
   */
  async handleWebhook(body: any, signature: string): Promise<void> {
    // Verify webhook signature
    if (this.webhookSecret) {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(body))
        .digest('hex');

      if (expectedSignature !== signature) {
        this.logger.warn('Webhook signature verification failed');
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    const event = body.event;
    const payload = body.payload;

    this.logger.log(`Received Razorpay webhook: ${event}`);

    switch (event) {
      // ===== Subscription Events =====
      case 'subscription.authenticated':
        await this.handleSubscriptionAuthenticated(payload);
        break;

      case 'subscription.activated':
        await this.handleSubscriptionActivated(payload);
        break;

      case 'subscription.charged':
        await this.handleSubscriptionCharged(payload);
        break;

      case 'subscription.pending':
        await this.handleSubscriptionPending(payload);
        break;

      case 'subscription.halted':
        await this.handleSubscriptionHalted(payload);
        break;

      case 'subscription.cancelled':
        await this.handleSubscriptionCancelled(payload);
        break;

      // ===== Payment Events =====
      case 'payment.captured':
        await this.handlePaymentCaptured(payload);
        break;

      case 'payment.failed':
        await this.handlePaymentFailed(payload);
        break;

      // ===== Order Events =====
      case 'order.paid':
        await this.handleOrderPaid(payload);
        break;

      default:
        this.logger.log(`Unhandled webhook event: ${event}`);
    }
  }

  private async handleSubscriptionAuthenticated(payload: any): Promise<void> {
    const subscription = payload.subscription?.entity;
    if (!subscription) return;

    const subscriptionId = subscription.notes?.subscriptionId;
    if (subscriptionId) {
      this.logger.log(`Subscription authenticated: ${subscriptionId}`);
    }
  }

  private async handleSubscriptionActivated(payload: any): Promise<void> {
    const subscription = payload.subscription?.entity;
    if (!subscription) return;

    const subscriptionId = subscription.notes?.subscriptionId;
    if (subscriptionId) {
      await this.subscriptionsService.activateSubscription(subscriptionId);
      this.logger.log(`Subscription activated via webhook: ${subscriptionId}`);
    }
  }

  private async handleSubscriptionCharged(payload: any): Promise<void> {
    const subscription = payload.subscription?.entity;
    const payment = payload.payment?.entity;
    if (!subscription || !payment) return;

    const subscriptionId = subscription.notes?.subscriptionId;
    if (subscriptionId) {
      // Renew the subscription - extend end date
      await this.subscriptionsService.activateSubscription(subscriptionId, payment.id);
      this.logger.log(
        `Subscription renewed via autopay: ${subscriptionId}, payment: ${payment.id}`,
      );
    }
  }

  private async handleSubscriptionPending(payload: any): Promise<void> {
    const subscription = payload.subscription?.entity;
    if (!subscription) return;

    const subscriptionId = subscription.notes?.subscriptionId;
    if (subscriptionId) {
      await this.subscriptionsService.updateUserSubscription(subscriptionId, {
        status: SubscriptionStatus.PAYMENT_PENDING,
        adminNotes: 'Autopay charge pending',
      });
      this.logger.log(`Subscription payment pending: ${subscriptionId}`);
    }
  }

  private async handleSubscriptionHalted(payload: any): Promise<void> {
    const subscription = payload.subscription?.entity;
    if (!subscription) return;

    const subscriptionId = subscription.notes?.subscriptionId;
    if (subscriptionId) {
      await this.subscriptionsService.updateUserSubscription(subscriptionId, {
        status: SubscriptionStatus.PAYMENT_FAILED,
        adminNotes: 'Autopay halted - multiple payment failures',
      });
      await this.recordPaymentFailure(
        subscriptionId,
        'Autopay halted due to repeated payment failures',
        'SUBSCRIPTION_HALTED',
      );
      this.logger.warn(`Subscription halted: ${subscriptionId}`);
    }
  }

  private async handleSubscriptionCancelled(payload: any): Promise<void> {
    const subscription = payload.subscription?.entity;
    if (!subscription) return;

    const subscriptionId = subscription.notes?.subscriptionId;
    if (subscriptionId) {
      await this.subscriptionsService.cancelSubscription(subscriptionId, 'Cancelled via Razorpay');
      this.logger.log(`Subscription cancelled via webhook: ${subscriptionId}`);
    }
  }

  private async handlePaymentCaptured(payload: any): Promise<void> {
    const payment = payload.payment?.entity;
    if (!payment) return;

    const { subscriptionId, orderId, type } = payment.notes || {};

    if (type === 'subscription' && subscriptionId) {
      await this.subscriptionsService.activateSubscription(subscriptionId, payment.id);
      this.logger.log(`Payment captured for subscription: ${subscriptionId}`);
    } else if (type === 'product_order' && orderId) {
      await this.ordersService.confirmOrderFromWebhook(orderId, payment.id);
      this.logger.log(`Payment captured for product order: ${orderId}`);
    } else {
      this.logger.log(`Payment captured but no matching handler for type: ${type}`);
    }
  }

  private async handlePaymentFailed(payload: any): Promise<void> {
    const payment = payload.payment?.entity;
    if (!payment) return;

    const { subscriptionId, orderId, type } = payment.notes || {};
    const errorDesc = payment.error_description || 'Payment failed';
    const errorCode = payment.error_code || 'UNKNOWN';

    if (type === 'subscription' && subscriptionId) {
      await this.subscriptionsService.updateUserSubscription(subscriptionId, {
        status: SubscriptionStatus.PAYMENT_FAILED,
        adminNotes: `Payment failed: ${errorDesc} (${errorCode})`,
      });
      await this.recordPaymentFailure(subscriptionId, errorDesc, errorCode);
      this.logger.warn(`Payment failed for subscription: ${subscriptionId} - ${errorDesc}`);
    } else if (type === 'product_order' && orderId) {
      this.logger.warn(
        `Payment failed for product order: ${orderId} - ${errorDesc} (${errorCode})`,
      );
      // Order stays in payment_pending — admin can check and handle
    }
  }

  private async handleOrderPaid(payload: any): Promise<void> {
    const order = payload.order?.entity;
    if (!order) return;

    const { orderId } = order.notes || {};
    if (!orderId) {
      this.logger.warn('order.paid webhook: no orderId in notes');
      return;
    }

    // Find a captured payment for this order
    const payments = order.payments?.items || [];
    const capturedPayment = payments.find((p: any) => p.status === 'captured');
    const paymentId = capturedPayment?.id || order.id;

    await this.ordersService.confirmOrderFromWebhook(orderId, paymentId);
    this.logger.log(`Order paid via webhook: ${orderId}`);
  }

  // ============================================
  // Payment Failure Tracking
  // ============================================

  async getPaymentFailures(filters?: {
    status?: string;
    limit?: number;
  }): Promise<PaymentRecordEntity[]> {
    const result = await this.db.query<PaymentRecordEntity>(this.paymentEntityType, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      filterExpression: '#status = :failedStatus',
      expressionAttributeNames: { '#status': 'status' },
      expressionAttributeValues: {
        ':pk': this.paymentEntityType,
        ':failedStatus': 'failed',
      },
      scanIndexForward: false,
      limit: filters?.limit || 100,
    });

    return result.items;
  }

  async getPaymentsByUser(userId: string): Promise<PaymentRecordEntity[]> {
    const result = await this.db.query<PaymentRecordEntity>(this.paymentEntityType, {
      indexName: 'GSI2',
      keyConditionExpression: 'GSI2PK = :pk',
      expressionAttributeValues: {
        ':pk': `USER#${userId}`,
      },
      scanIndexForward: false,
    });

    return result.items;
  }

  // ============================================
  // Internal Helpers
  // ============================================

  private async createPaymentRecord(data: {
    type: 'subscription' | 'donation' | 'yagya';
    userId?: string;
    userEmail?: string;
    entityId: string;
    razorpayOrderId?: string;
    razorpaySubscriptionId?: string;
    razorpayPlanId?: string;
    amount: number;
    currency: string;
    status: string;
    name?: string;
    phone?: string;
    category?: string;
    tier?: string;
  }): Promise<PaymentRecordEntity> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const entity: PaymentRecordEntity = {
      PK: `${this.paymentEntityType}#${id}`,
      SK: `${this.paymentEntityType}#${id}`,
      GSI1PK: this.paymentEntityType,
      GSI1SK: `DATE#${now}`,
      ...(data.userId && {
        GSI2PK: `USER#${data.userId}`,
        GSI2SK: `PAYMENT#${now}`,
      }),
      id,
      type: data.type,
      userId: data.userId,
      userEmail: data.userEmail,
      entityId: data.entityId,
      razorpayOrderId: data.razorpayOrderId,
      razorpaySubscriptionId: data.razorpaySubscriptionId,
      razorpayPlanId: data.razorpayPlanId,
      amount: data.amount,
      currency: data.currency,
      status: data.status as any,
      name: data.name,
      phone: data.phone,
      category: data.category,
      tier: data.tier,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.put(entity);
    return entity;
  }

  private async updatePaymentByEntity(
    entityId: string,
    updates: Partial<
      Pick<
        PaymentRecordEntity,
        'razorpayPaymentId' | 'status' | 'failureReason' | 'errorCode' | 'method'
      >
    >,
  ): Promise<void> {
    // Find payment record by entityId
    const result = await this.db.query<PaymentRecordEntity>(this.paymentEntityType, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      filterExpression: 'entityId = :entityId',
      expressionAttributeValues: {
        ':pk': this.paymentEntityType,
        ':entityId': entityId,
      },
      scanIndexForward: false,
      limit: 1,
    });

    if (result.items.length === 0) return;

    const payment = result.items[0];
    const updateExpressions: string[] = ['updatedAt = :updatedAt'];
    const expressionAttributeValues: Record<string, any> = {
      ':updatedAt': new Date().toISOString(),
    };

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        if (key === 'status') {
          updateExpressions.push('#status = :status');
        } else {
          updateExpressions.push(`${key} = :${key}`);
        }
        expressionAttributeValues[`:${key}`] = value;
      }
    }

    const expressionAttributeNames: Record<string, string> | undefined =
      updates.status !== undefined ? { '#status': 'status' } : undefined;

    await this.db.update<PaymentRecordEntity>(this.paymentEntityType, {
      key: { PK: payment.PK, SK: payment.SK },
      updateExpression: `SET ${updateExpressions.join(', ')}`,
      expressionAttributeNames,
      expressionAttributeValues,
    });
  }

  // ============================================
  // Admin — List all payments with pagination
  // ============================================

  async getAllPaymentsAdmin(params: {
    limit?: number;
    cursor?: string;
    type?: string;
    status?: string;
  }): Promise<{ items: PaymentRecordEntity[]; cursor?: string; total: number }> {
    const limit = Math.min(params.limit || 50, 200);

    let filterExpression: string | undefined;
    const expressionAttributeValues: Record<string, any> = {
      ':pk': this.paymentEntityType,
    };
    const expressionAttributeNames: Record<string, string> = {};

    const filterParts: string[] = [];

    if (params.type) {
      filterParts.push('#type = :type');
      expressionAttributeNames['#type'] = 'type';
      expressionAttributeValues[':type'] = params.type;
    }

    if (params.status) {
      filterParts.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = params.status;
    }

    if (filterParts.length > 0) {
      filterExpression = filterParts.join(' AND ');
    }

    const queryParams: any = {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      filterExpression,
      expressionAttributeValues,
      scanIndexForward: false,
      limit,
    };

    if (Object.keys(expressionAttributeNames).length > 0) {
      queryParams.expressionAttributeNames = expressionAttributeNames;
    }

    if (params.cursor) {
      try {
        queryParams.exclusiveStartKey = JSON.parse(
          Buffer.from(params.cursor, 'base64').toString('utf8'),
        );
      } catch {
        // ignore invalid cursor
      }
    }

    const result = await this.db.query<PaymentRecordEntity>(this.paymentEntityType, queryParams);

    const nextCursor = result.lastKey
      ? Buffer.from(JSON.stringify(result.lastKey)).toString('base64')
      : undefined;

    return {
      items: result.items,
      cursor: nextCursor,
      total: result.items.length,
    };
  }

  // ============================================
  // Admin — Initiate refund for a payment
  // ============================================

  async initiateRefund(
    paymentId: string,
    amount?: number,
    reason?: string,
  ): Promise<any> {
    // Fetch payment record by PK using direct get
    const pk = `${this.paymentEntityType}#${paymentId}`;
    const payment = await this.db.get<PaymentRecordEntity>(pk, pk);

    if (!payment) {
      throw new BadRequestException(`Payment record not found: ${paymentId}`);
    }

    if (payment.status !== 'captured') {
      throw new BadRequestException(
        `Refund only allowed for captured payments. Current status: ${payment.status}`,
      );
    }

    if (!payment.razorpayPaymentId) {
      throw new BadRequestException('Payment has no Razorpay payment ID — cannot refund.');
    }

    // Determine correct Razorpay account from category
    const accountType = this.getYagyaAccountType(payment.category || '');
    const config = await this.settingsService.getRazorpayConfigForAccount(accountType);

    const Razorpay = require('razorpay');
    const rzpInstance = new Razorpay({
      key_id: config.keyId,
      key_secret: config.keySecret,
    });

    const refundAmount = amount || payment.amount; // in paise

    const refundResponse = await rzpInstance.payments.refund(payment.razorpayPaymentId, {
      amount: refundAmount,
      notes: { reason: reason || 'Admin refund' },
    });

    // Update record status to refunded
    await this.db.update<PaymentRecordEntity>(this.paymentEntityType, {
      key: { PK: payment.PK, SK: payment.SK },
      updateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      expressionAttributeNames: { '#status': 'status' },
      expressionAttributeValues: {
        ':status': 'refunded',
        ':updatedAt': new Date().toISOString(),
      },
    });

    return {
      success: true,
      refundId: refundResponse.id,
      paymentId: payment.razorpayPaymentId,
      amount: refundAmount,
      status: refundResponse.status,
    };
  }

  private async recordPaymentFailure(
    subscriptionId: string,
    reason: string,
    errorCode: string,
  ): Promise<void> {
    try {
      // Find and update corresponding payment record
      await this.updatePaymentByEntity(subscriptionId, {
        status: 'failed',
        failureReason: reason,
        errorCode,
      });
    } catch (error) {
      this.logger.error(`Failed to record payment failure for ${subscriptionId}`, error);
    }
  }
}
