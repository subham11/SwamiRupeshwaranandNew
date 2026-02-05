import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { DatabaseService, DATABASE_SERVICE } from '@/common/database';
import { EmailService } from '@/common/email/email.service';
import {
  CreateDonationConfigDto,
  UpdateDonationConfigDto,
  DonationConfigResponseDto,
  CreateDonationDto,
  UpdateDonationDto,
  DonationResponseDto,
  CreateRazorpayOrderDto,
  VerifyPaymentDto,
  RazorpayOrderResponseDto,
  DonationStatsDto,
  DonationStatus,
  DonationType,
  DonationPurpose,
  PaymentMethod,
  LocalizedStringDto,
  DonationAmountOptionDto,
} from './dto';

// ============================================
// Entity Interfaces
// ============================================

interface DonationConfigEntity {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  id: string;
  purpose: DonationPurpose;
  title: LocalizedStringDto;
  description?: LocalizedStringDto;
  suggestedAmounts: DonationAmountOptionDto[];
  minimumAmount: number;
  maximumAmount?: number;
  allowCustomAmount: boolean;
  isActive: boolean;
  displayOrder: number;
  iconUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface DonationEntity {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  GSI2PK?: string;
  GSI2SK?: string;
  id: string;
  donationNumber: string;
  amount: number;
  purpose: DonationPurpose;
  donationType: DonationType;
  status: DonationStatus;
  paymentMethod?: PaymentMethod;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  panNumber?: string;
  address?: string;
  message?: string;
  isAnonymous: boolean;
  wants80GCertificate: boolean;
  receiptSent: boolean;
  receiptUrl?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  transactionId?: string;
  userId?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class DonationService {
  private readonly logger = new Logger(DonationService.name);
  private readonly configEntityType = 'DONATION_CONFIG';
  private readonly donationEntityType = 'DONATION';
  private readonly razorpayKeyId: string;
  private readonly razorpayKeySecret: string;

  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: DatabaseService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    this.razorpayKeyId = this.configService.get<string>('RAZORPAY_KEY_ID', '');
    this.razorpayKeySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET', '');
  }

  // ============================================
  // Donation Config Methods
  // ============================================

  async createConfig(dto: CreateDonationConfigDto): Promise<DonationConfigResponseDto> {
    // Check if config for this purpose already exists
    const existing = await this.findConfigByPurpose(dto.purpose);
    if (existing) {
      throw new BadRequestException(`Configuration for purpose '${dto.purpose}' already exists`);
    }

    const now = new Date().toISOString();
    const id = uuidv4();

    const entity: DonationConfigEntity = {
      PK: `${this.configEntityType}#${id}`,
      SK: `${this.configEntityType}#${id}`,
      GSI1PK: this.configEntityType,
      GSI1SK: `PURPOSE#${dto.purpose}`,
      id,
      purpose: dto.purpose,
      title: dto.title,
      description: dto.description,
      suggestedAmounts: dto.suggestedAmounts,
      minimumAmount: dto.minimumAmount || 100,
      maximumAmount: dto.maximumAmount,
      allowCustomAmount: dto.allowCustomAmount ?? true,
      isActive: dto.isActive ?? true,
      displayOrder: dto.displayOrder || 0,
      iconUrl: dto.iconUrl,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.put(entity);
    return this.mapConfigToResponse(entity);
  }

  async findAllConfigs(activeOnly = false): Promise<DonationConfigResponseDto[]> {
    const result = await this.db.query<DonationConfigEntity>(this.configEntityType, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      expressionAttributeValues: {
        ':pk': this.configEntityType,
      },
    });

    let configs = result.items as DonationConfigEntity[];

    if (activeOnly) {
      configs = configs.filter((c) => c.isActive);
    }

    return configs
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((c) => this.mapConfigToResponse(c));
  }

  async findConfigById(id: string): Promise<DonationConfigResponseDto | null> {
    const result = await this.db.get<DonationConfigEntity>(
      `${this.configEntityType}#${id}`,
      `${this.configEntityType}#${id}`,
    );

    if (!result) return null;
    return this.mapConfigToResponse(result as DonationConfigEntity);
  }

  async findConfigByPurpose(purpose: DonationPurpose): Promise<DonationConfigEntity | null> {
    const result = await this.db.query<DonationConfigEntity>(this.configEntityType, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
      expressionAttributeValues: {
        ':pk': this.configEntityType,
        ':sk': `PURPOSE#${purpose}`,
      },
    });

    return (result.items[0] as DonationConfigEntity) || null;
  }

  async updateConfig(id: string, dto: UpdateDonationConfigDto): Promise<DonationConfigResponseDto> {
    const existing = await this.findConfigById(id);
    if (!existing) {
      throw new NotFoundException('Donation configuration not found');
    }

    const updateExpression: string[] = ['#updatedAt = :updatedAt'];
    const expressionAttributeNames: Record<string, string> = { '#updatedAt': 'updatedAt' };
    const expressionAttributeValues: Record<string, unknown> = { ':updatedAt': new Date().toISOString() };

    const fields = [
      'title',
      'description',
      'suggestedAmounts',
      'minimumAmount',
      'maximumAmount',
      'allowCustomAmount',
      'isActive',
      'displayOrder',
      'iconUrl',
    ] as const;

    for (const field of fields) {
      const value = (dto as any)[field];
      if (value !== undefined) {
        updateExpression.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = value;
      }
    }

    await this.db.update<DonationConfigEntity>(this.configEntityType, {
      key: {
        PK: `${this.configEntityType}#${id}`,
        SK: `${this.configEntityType}#${id}`,
      },
      updateExpression: `SET ${updateExpression.join(', ')}`,
      expressionAttributeNames,
      expressionAttributeValues,
    });

    return this.findConfigById(id) as Promise<DonationConfigResponseDto>;
  }

  async deleteConfig(id: string): Promise<void> {
    await this.db.delete(
      `${this.configEntityType}#${id}`,
      `${this.configEntityType}#${id}`,
    );
  }

  // ============================================
  // Donation Methods
  // ============================================

  async createDonation(dto: CreateDonationDto, userId?: string): Promise<DonationResponseDto> {
    const now = new Date().toISOString();
    const id = uuidv4();
    const donationNumber = await this.generateDonationNumber();

    const entity: DonationEntity = {
      PK: `${this.donationEntityType}#${id}`,
      SK: `${this.donationEntityType}#${id}`,
      GSI1PK: this.donationEntityType,
      GSI1SK: `DATE#${now}`,
      ...(userId && {
        GSI2PK: `USER#${userId}`,
        GSI2SK: `DONATION#${now}`,
      }),
      id,
      donationNumber,
      amount: dto.amount,
      purpose: dto.purpose,
      donationType: dto.donationType || DonationType.ONE_TIME,
      status: DonationStatus.PENDING,
      donorName: dto.donorName,
      donorEmail: dto.donorEmail,
      donorPhone: dto.donorPhone,
      panNumber: dto.panNumber,
      address: dto.address,
      message: dto.message,
      isAnonymous: dto.isAnonymous || false,
      wants80GCertificate: dto.wants80GCertificate || false,
      receiptSent: false,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.put(entity);
    return this.mapDonationToResponse(entity);
  }

  async findAllDonations(status?: DonationStatus): Promise<DonationResponseDto[]> {
    const result = await this.db.query<DonationEntity>(this.donationEntityType, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      expressionAttributeValues: {
        ':pk': this.donationEntityType,
      },
    });

    let donations = result.items as DonationEntity[];

    if (status) {
      donations = donations.filter((d) => d.status === status);
    }

    return donations
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((d) => this.mapDonationToResponse(d));
  }

  async findDonationsByUser(userId: string): Promise<DonationResponseDto[]> {
    const result = await this.db.query<DonationEntity>(this.donationEntityType, {
      indexName: 'GSI2',
      keyConditionExpression: 'GSI2PK = :pk',
      expressionAttributeValues: {
        ':pk': `USER#${userId}`,
      },
    });

    return (result.items as DonationEntity[])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((d) => this.mapDonationToResponse(d));
  }

  async findDonationById(id: string): Promise<DonationResponseDto | null> {
    const result = await this.db.get<DonationEntity>(
      `${this.donationEntityType}#${id}`,
      `${this.donationEntityType}#${id}`,
    );

    if (!result) return null;
    return this.mapDonationToResponse(result as DonationEntity);
  }

  async updateDonation(id: string, dto: UpdateDonationDto): Promise<DonationResponseDto> {
    const existing = await this.findDonationById(id);
    if (!existing) {
      throw new NotFoundException('Donation not found');
    }

    const updateExpression: string[] = ['#updatedAt = :updatedAt'];
    const expressionAttributeNames: Record<string, string> = { '#updatedAt': 'updatedAt' };
    const expressionAttributeValues: Record<string, unknown> = { ':updatedAt': new Date().toISOString() };

    const fields = [
      'status',
      'razorpayPaymentId',
      'razorpayOrderId',
      'transactionId',
      'adminNotes',
      'receiptSent',
      'receiptUrl',
    ] as const;

    for (const field of fields) {
      const value = (dto as any)[field];
      if (value !== undefined) {
        updateExpression.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = value;
      }
    }

    await this.db.update<DonationEntity>(this.donationEntityType, {
      key: {
        PK: `${this.donationEntityType}#${id}`,
        SK: `${this.donationEntityType}#${id}`,
      },
      updateExpression: `SET ${updateExpression.join(', ')}`,
      expressionAttributeNames,
      expressionAttributeValues,
    });

    return this.findDonationById(id) as Promise<DonationResponseDto>;
  }

  // ============================================
  // Razorpay Integration
  // ============================================

  async createRazorpayOrder(dto: CreateRazorpayOrderDto, userId?: string): Promise<RazorpayOrderResponseDto> {
    // Create donation record first
    const donation = await this.createDonation({
      amount: dto.amount,
      purpose: dto.purpose,
      donorName: dto.donorName,
      donorEmail: dto.donorEmail,
      donorPhone: dto.donorPhone,
    }, userId);

    // In production, call Razorpay API to create order
    // For now, simulate order creation
    const orderId = `order_${uuidv4().replace(/-/g, '').substring(0, 14)}`;

    // Update donation with order ID
    await this.updateDonation(donation.id, { razorpayOrderId: orderId });

    return {
      orderId,
      donationId: donation.id,
      amount: dto.amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      keyId: this.razorpayKeyId,
    };
  }

  async verifyPayment(dto: VerifyPaymentDto): Promise<DonationResponseDto> {
    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', this.razorpayKeySecret)
      .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== dto.razorpaySignature) {
      throw new BadRequestException('Payment verification failed');
    }

    // Update donation status
    const donation = await this.updateDonation(dto.donationId, {
      status: DonationStatus.COMPLETED,
      razorpayPaymentId: dto.razorpayPaymentId,
      razorpayOrderId: dto.razorpayOrderId,
    });

    // Send receipt email
    this.sendDonationReceipt(donation);

    return donation;
  }

  // ============================================
  // Stats
  // ============================================

  async getStats(): Promise<DonationStatsDto> {
    const donations = await this.findAllDonations(DonationStatus.COMPLETED);

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthDonations = donations.filter(
      (d) => new Date(d.createdAt) >= thisMonth,
    );
    const lastMonthDonations = donations.filter(
      (d) => new Date(d.createdAt) >= lastMonth && new Date(d.createdAt) <= lastMonthEnd,
    );

    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
    const thisMonthAmount = thisMonthDonations.reduce((sum, d) => sum + d.amount, 0);
    const lastMonthAmount = lastMonthDonations.reduce((sum, d) => sum + d.amount, 0);

    // Count by purpose
    const purposeCounts: Record<DonationPurpose, number> = {} as Record<DonationPurpose, number>;
    for (const donation of donations) {
      purposeCounts[donation.purpose] = (purposeCounts[donation.purpose] || 0) + 1;
    }

    const topPurpose = Object.entries(purposeCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] as DonationPurpose || DonationPurpose.GENERAL;

    // Unique donors
    const donors = new Set(donations.filter((d) => d.donorEmail).map((d) => d.donorEmail));
    const recurringDonors = new Set(
      donations.filter((d) => d.donationType === DonationType.RECURRING && d.donorEmail).map((d) => d.donorEmail),
    );

    return {
      totalDonations: donations.length,
      totalAmount,
      thisMonthAmount,
      lastMonthAmount,
      averageDonation: donations.length > 0 ? totalAmount / donations.length : 0,
      topPurpose,
      donorCount: donors.size,
      recurringDonors: recurringDonors.size,
    };
  }

  // ============================================
  // Helper Methods
  // ============================================

  private async generateDonationNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const donations = await this.findAllDonations();
    const count = donations.filter((d) => d.donationNumber.includes(`DON-${year}`)).length + 1;
    return `DON-${year}-${count.toString().padStart(4, '0')}`;
  }

  private async sendDonationReceipt(donation: DonationResponseDto): Promise<void> {
    if (!donation.donorEmail) return;

    try {
      await this.emailService.sendEmail({
        to: donation.donorEmail,
        toName: donation.donorName,
        subject: `Donation Receipt - ${donation.donationNumber} 🙏`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #F97316;">॥ ॐ नमः शिवाय ॥</h2>
            <h3>Thank You for Your Generous Donation!</h3>
            <p>Dear ${donation.donorName || 'Devotee'},</p>
            <p>We have received your donation. Your contribution will help support our ashram's activities.</p>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Donation Number:</strong> ${donation.donationNumber}</p>
              <p><strong>Amount:</strong> ₹${donation.amount.toLocaleString()}</p>
              <p><strong>Purpose:</strong> ${donation.purpose.replace(/_/g, ' ')}</p>
              <p><strong>Date:</strong> ${new Date(donation.createdAt).toLocaleDateString()}</p>
            </div>
            
            ${donation.wants80GCertificate ? '<p>Your 80G certificate will be emailed separately.</p>' : ''}
            
            <p>May Swamiji's blessings be with you always.</p>
            
            <p style="color: #666;">With gratitude,<br/>Swami Rupeshwaranand Ashram</p>
          </div>
        `,
      });

      await this.updateDonation(donation.id, { receiptSent: true });
    } catch (error) {
      this.logger.error('Failed to send donation receipt:', error);
    }
  }

  private mapConfigToResponse(entity: DonationConfigEntity): DonationConfigResponseDto {
    return {
      id: entity.id,
      purpose: entity.purpose,
      title: entity.title,
      description: entity.description,
      suggestedAmounts: entity.suggestedAmounts,
      minimumAmount: entity.minimumAmount,
      maximumAmount: entity.maximumAmount,
      allowCustomAmount: entity.allowCustomAmount,
      isActive: entity.isActive,
      displayOrder: entity.displayOrder,
      iconUrl: entity.iconUrl,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private mapDonationToResponse(entity: DonationEntity): DonationResponseDto {
    return {
      id: entity.id,
      donationNumber: entity.donationNumber,
      amount: entity.amount,
      purpose: entity.purpose,
      donationType: entity.donationType,
      status: entity.status,
      paymentMethod: entity.paymentMethod,
      donorName: entity.donorName,
      donorEmail: entity.donorEmail,
      donorPhone: entity.donorPhone,
      panNumber: entity.panNumber,
      address: entity.address,
      message: entity.message,
      isAnonymous: entity.isAnonymous,
      wants80GCertificate: entity.wants80GCertificate,
      receiptSent: entity.receiptSent,
      receiptUrl: entity.receiptUrl,
      razorpayPaymentId: entity.razorpayPaymentId,
      razorpayOrderId: entity.razorpayOrderId,
      transactionId: entity.transactionId,
      userId: entity.userId,
      adminNotes: entity.adminNotes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
