import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { DatabaseService, DATABASE_SERVICE } from '@/common/database';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateCouponDto,
  UpdateCouponDto,
  ValidateCouponResponseDto,
  CouponResponseDto,
  CouponStatsDto,
  CouponUsageRecordDto,
  CouponType,
} from './dto';

// ============================================
// Entity Interfaces (DynamoDB Single-Table)
// ============================================

interface CouponEntity {
  PK: string; // COUPON#<couponId>
  SK: string; // COUPON#<couponId>
  GSI1PK: string; // COUPON
  GSI1SK: string; // CODE#<code>
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  expiresAt: string;
  isActive: boolean;
  usageLimit: number;
  usageCount: number;
  applicableCategories?: string[];
  createdAt: string;
  updatedAt: string;
}

interface CouponUsageEntity {
  PK: string; // COUPON_USAGE#<couponId>
  SK: string; // USER#<userId>
  couponId: string;
  userId: string;
  orderId: string;
  discountAmount: number;
  usedAt: string;
}

@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);

  constructor(
    @Inject(DATABASE_SERVICE)
    private readonly databaseService: DatabaseService,
  ) {}

  // ============================================
  // Admin Operations
  // ============================================

  async createCoupon(dto: CreateCouponDto): Promise<CouponResponseDto> {
    const code = dto.code.toUpperCase().trim();
    const id = uuidv4();
    const now = new Date().toISOString();

    // Check if coupon code already exists
    const existingResult = await this.databaseService.query<CouponEntity>('COUPON', {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :gsi1pk AND GSI1SK = :gsi1sk',
      expressionAttributeValues: {
        ':gsi1pk': 'COUPON',
        ':gsi1sk': `CODE#${code}`,
      },
    });

    if (existingResult.items.length > 0) {
      throw new ConflictException(`Coupon with code "${code}" already exists`);
    }

    const coupon: CouponEntity = {
      PK: `COUPON#${id}`,
      SK: `COUPON#${id}`,
      GSI1PK: 'COUPON',
      GSI1SK: `CODE#${code}`,
      id,
      code,
      type: dto.type,
      value: dto.value,
      minOrderAmount: dto.minOrderAmount,
      maxDiscount: dto.maxDiscount,
      expiresAt: dto.expiresAt,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      usageLimit: dto.usageLimit || 0,
      usageCount: 0,
      applicableCategories: dto.applicableCategories,
      createdAt: now,
      updatedAt: now,
    };

    await this.databaseService.put(coupon);

    return this.toCouponResponse(coupon);
  }

  async updateCoupon(id: string, dto: UpdateCouponDto): Promise<CouponResponseDto> {
    const existing = await this.databaseService.get<CouponEntity>(`COUPON#${id}`, `COUPON#${id}`);

    if (!existing) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    const now = new Date().toISOString();
    const newCode = dto.code ? dto.code.toUpperCase().trim() : existing.code;

    // If code is changing, check for uniqueness
    if (dto.code && newCode !== existing.code) {
      const codeCheck = await this.databaseService.query<CouponEntity>('COUPON', {
        indexName: 'GSI1',
        keyConditionExpression: 'GSI1PK = :gsi1pk AND GSI1SK = :gsi1sk',
        expressionAttributeValues: {
          ':gsi1pk': 'COUPON',
          ':gsi1sk': `CODE#${newCode}`,
        },
      });

      if (codeCheck.items.length > 0) {
        throw new ConflictException(`Coupon with code "${newCode}" already exists`);
      }
    }

    // Build updated entity (replace entire item to handle GSI key changes)
    const updated: CouponEntity = {
      PK: `COUPON#${id}`,
      SK: `COUPON#${id}`,
      GSI1PK: 'COUPON',
      GSI1SK: `CODE#${newCode}`,
      id,
      code: newCode,
      type: dto.type !== undefined ? dto.type : existing.type,
      value: dto.value !== undefined ? dto.value : existing.value,
      minOrderAmount:
        dto.minOrderAmount !== undefined ? dto.minOrderAmount : existing.minOrderAmount,
      maxDiscount: dto.maxDiscount !== undefined ? dto.maxDiscount : existing.maxDiscount,
      expiresAt: dto.expiresAt !== undefined ? dto.expiresAt : existing.expiresAt,
      isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
      usageLimit: dto.usageLimit !== undefined ? dto.usageLimit : existing.usageLimit,
      usageCount: existing.usageCount,
      applicableCategories:
        dto.applicableCategories !== undefined
          ? dto.applicableCategories
          : existing.applicableCategories,
      createdAt: existing.createdAt,
      updatedAt: now,
    };

    // If code changed, delete old item first (GSI keys changed)
    if (newCode !== existing.code) {
      await this.databaseService.delete(existing.PK, existing.SK);
    }

    await this.databaseService.put(updated);

    return this.toCouponResponse(updated);
  }

  async deleteCoupon(id: string): Promise<void> {
    const existing = await this.databaseService.get<CouponEntity>(`COUPON#${id}`, `COUPON#${id}`);

    if (!existing) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    await this.databaseService.delete(`COUPON#${id}`, `COUPON#${id}`);
  }

  async listCoupons(): Promise<CouponResponseDto[]> {
    const result = await this.databaseService.query<CouponEntity>('COUPON', {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :gsi1pk AND begins_with(GSI1SK, :prefix)',
      expressionAttributeValues: {
        ':gsi1pk': 'COUPON',
        ':prefix': 'CODE#',
      },
    });

    return result.items.map((item) => this.toCouponResponse(item));
  }

  async getCouponByCode(code: string): Promise<CouponEntity | null> {
    const normalizedCode = code.toUpperCase().trim();

    const result = await this.databaseService.query<CouponEntity>('COUPON', {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :gsi1pk AND GSI1SK = :gsi1sk',
      expressionAttributeValues: {
        ':gsi1pk': 'COUPON',
        ':gsi1sk': `CODE#${normalizedCode}`,
      },
    });

    return result.items.length > 0 ? result.items[0] : null;
  }

  // ============================================
  // User Operations
  // ============================================

  async validateCoupon(
    code: string,
    userId: string,
    cartTotal: number,
  ): Promise<ValidateCouponResponseDto> {
    const coupon = await this.getCouponByCode(code);

    if (!coupon) {
      return { valid: false, message: 'Coupon not found' };
    }

    if (!coupon.isActive) {
      return { valid: false, message: 'This coupon is no longer active' };
    }

    // Check expiration
    if (new Date(coupon.expiresAt) < new Date()) {
      return { valid: false, message: 'This coupon has expired' };
    }

    // Check usage limit (0 = unlimited)
    if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, message: 'This coupon has reached its usage limit' };
    }

    // Check if user has already used this coupon
    const usageRecord = await this.databaseService.get<CouponUsageEntity>(
      `COUPON_USAGE#${coupon.id}`,
      `USER#${userId}`,
    );

    if (usageRecord) {
      return { valid: false, message: 'You have already used this coupon' };
    }

    // Check minimum order amount
    if (cartTotal < coupon.minOrderAmount) {
      return {
        valid: false,
        message: `Minimum order amount of ${coupon.minOrderAmount} INR required`,
      };
    }

    // Calculate discount
    const discountAmount = this.calculateDiscount(coupon, cartTotal);

    return {
      valid: true,
      discountAmount,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
    };
  }

  async applyCoupon(
    code: string,
    userId: string,
    orderId: string,
    cartTotal: number,
  ): Promise<ValidateCouponResponseDto> {
    // Re-validate before applying
    const validation = await this.validateCoupon(code, userId, cartTotal);

    if (!validation.valid) {
      throw new BadRequestException(validation.message);
    }

    const coupon = await this.getCouponByCode(code);
    if (!coupon) {
      throw new BadRequestException('Coupon not found');
    }

    const discountAmount = this.calculateDiscount(coupon, cartTotal);
    const now = new Date().toISOString();

    // Record usage
    const usageEntity: CouponUsageEntity = {
      PK: `COUPON_USAGE#${coupon.id}`,
      SK: `USER#${userId}`,
      couponId: coupon.id,
      userId,
      orderId,
      discountAmount,
      usedAt: now,
    };

    await this.databaseService.put(usageEntity);

    // Increment usage count
    await this.databaseService.update('COUPON', {
      key: { PK: `COUPON#${coupon.id}`, SK: `COUPON#${coupon.id}` },
      updateExpression: 'SET usageCount = usageCount + :inc, updatedAt = :now',
      expressionAttributeValues: {
        ':inc': 1,
        ':now': now,
      },
    });

    return {
      valid: true,
      discountAmount,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
    };
  }

  async getCouponStats(id: string): Promise<CouponStatsDto> {
    const coupon = await this.databaseService.get<CouponEntity>(`COUPON#${id}`, `COUPON#${id}`);

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    // Fetch usage records
    const usageResult = await this.databaseService.query<CouponUsageEntity>('COUPON_USAGE', {
      keyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      expressionAttributeValues: {
        ':pk': `COUPON_USAGE#${id}`,
        ':skPrefix': 'USER#',
      },
    });

    const totalDiscountGiven = usageResult.items.reduce(
      (sum, usage) => sum + usage.discountAmount,
      0,
    );

    const recentUsage: CouponUsageRecordDto[] = usageResult.items
      .sort((a, b) => new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime())
      .slice(0, 50)
      .map((usage) => ({
        userId: usage.userId,
        orderId: usage.orderId,
        discountAmount: usage.discountAmount,
        usedAt: usage.usedAt,
      }));

    return {
      couponId: coupon.id,
      code: coupon.code,
      totalUses: coupon.usageCount,
      usageLimit: coupon.usageLimit,
      totalDiscountGiven,
      recentUsage,
    };
  }

  // ============================================
  // Helpers
  // ============================================

  private calculateDiscount(coupon: CouponEntity, cartTotal: number): number {
    let discount: number;

    if (coupon.type === CouponType.PERCENTAGE) {
      discount = (cartTotal * coupon.value) / 100;
      // Cap at maxDiscount if set
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      // Flat discount
      discount = coupon.value;
    }

    // Discount cannot exceed cart total
    if (discount > cartTotal) {
      discount = cartTotal;
    }

    return Math.round(discount * 100) / 100;
  }

  private toCouponResponse(entity: CouponEntity): CouponResponseDto {
    return {
      id: entity.id,
      code: entity.code,
      type: entity.type,
      value: entity.value,
      minOrderAmount: entity.minOrderAmount,
      maxDiscount: entity.maxDiscount,
      expiresAt: entity.expiresAt,
      isActive: entity.isActive,
      usageLimit: entity.usageLimit,
      usageCount: entity.usageCount,
      applicableCategories: entity.applicableCategories,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
