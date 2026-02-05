import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService, DATABASE_SERVICE } from '@/common/database';
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
  SubscriptionPlanResponseDto,
  SubscriptionPlanListResponseDto,
  CreateUserSubscriptionDto,
  UpdateUserSubscriptionDto,
  UserSubscriptionResponseDto,
  UserSubscriptionListResponseDto,
  CreateSubscriptionContentDto,
  UpdateSubscriptionContentDto,
  SubscriptionContentResponseDto,
  SubscriptionContentListResponseDto,
  SubscriptionPlanType,
  SubscriptionStatus,
  PaymentMethod,
  BillingCycle,
  ContentType,
  PlanContentDto,
  GuidanceDetailsDto,
} from './dto';

// ============================================
// Entity Interfaces
// ============================================
interface SubscriptionPlanEntity {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  id: string;
  planType: SubscriptionPlanType;
  name: string;
  description: string;
  price: number;
  billingCycle: BillingCycle;
  paymentMethod: PaymentMethod;
  autopayEnabled: boolean;
  contents: PlanContentDto[];
  guidance?: GuidanceDetailsDto;
  features: string[];
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface UserSubscriptionEntity {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  GSI2PK: string;
  GSI2SK: string;
  id: string;
  userId: string;
  userEmail: string;
  planId: string;
  planName: string;
  planType: SubscriptionPlanType;
  pricePaid: number;
  status: SubscriptionStatus;
  paymentMethod: PaymentMethod;
  razorpaySubscriptionId?: string;
  razorpayPaymentId?: string;
  startDate: string;
  endDate: string;
  nextBillingDate?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionContentEntity {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  id: string;
  planId: string;
  contentType: ContentType;
  title: string;
  description?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  displayOrder: number;
  locale: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class SubscriptionsService {
  private readonly planEntityType = 'SUBSCRIPTION_PLAN';
  private readonly userSubEntityType = 'USER_SUBSCRIPTION';
  private readonly contentEntityType = 'SUBSCRIPTION_CONTENT';

  constructor(
    @Inject(DATABASE_SERVICE)
    private readonly databaseService: DatabaseService,
  ) {}

  // ============================================
  // Subscription Plan Methods
  // ============================================

  async createPlan(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlanResponseDto> {
    const id = uuidv4();

    const plan: SubscriptionPlanEntity = {
      PK: `${this.planEntityType}#${id}`,
      SK: `${this.planEntityType}#${id}`,
      GSI1PK: this.planEntityType,
      GSI1SK: `ORDER#${String(dto.displayOrder || 0).padStart(3, '0')}#${dto.planType}`,
      id,
      planType: dto.planType,
      name: dto.name,
      description: dto.description,
      price: dto.price,
      billingCycle: dto.billingCycle,
      paymentMethod: dto.paymentMethod,
      autopayEnabled: dto.autopayEnabled ?? false,
      contents: dto.contents || [],
      guidance: dto.guidance,
      features: dto.features || [],
      isActive: dto.isActive ?? true,
      displayOrder: dto.displayOrder || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.databaseService.put(plan);
    return this.mapPlanToResponse(plan);
  }

  async findAllPlans(activeOnly = false): Promise<SubscriptionPlanListResponseDto> {
    const result = await this.databaseService.query<SubscriptionPlanEntity>(this.planEntityType, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      expressionAttributeValues: {
        ':pk': this.planEntityType,
      },
      scanIndexForward: true,
    });

    let items = result.items;
    if (activeOnly) {
      items = items.filter((item) => item.isActive);
    }

    return {
      items: items.map(this.mapPlanToResponse),
      count: items.length,
    };
  }

  async findPlanById(id: string): Promise<SubscriptionPlanResponseDto> {
    const plan = await this.databaseService.get<SubscriptionPlanEntity>(
      `${this.planEntityType}#${id}`,
      `${this.planEntityType}#${id}`,
    );

    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }

    return this.mapPlanToResponse(plan);
  }

  async findPlanByType(planType: SubscriptionPlanType): Promise<SubscriptionPlanResponseDto | null> {
    const result = await this.databaseService.query<SubscriptionPlanEntity>(this.planEntityType, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      filterExpression: 'planType = :planType',
      expressionAttributeValues: {
        ':pk': this.planEntityType,
        ':planType': planType,
      },
    });

    if (result.items.length === 0) {
      return null;
    }

    return this.mapPlanToResponse(result.items[0]);
  }

  async updatePlan(id: string, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlanResponseDto> {
    const existing = await this.findPlanById(id);
    if (!existing) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    const fieldsToUpdate = [
      'name', 'description', 'price', 'billingCycle', 'paymentMethod',
      'autopayEnabled', 'contents', 'guidance', 'features', 'isActive', 'displayOrder',
    ];

    for (const field of fieldsToUpdate) {
      if ((dto as any)[field] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = (dto as any)[field];
      }
    }

    updateExpressions.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    if (updateExpressions.length === 1) {
      return existing;
    }

    const updated = await this.databaseService.update<SubscriptionPlanEntity>(this.planEntityType, {
      key: {
        PK: `${this.planEntityType}#${id}`,
        SK: `${this.planEntityType}#${id}`,
      },
      updateExpression: `SET ${updateExpressions.join(', ')}`,
      expressionAttributeNames,
      expressionAttributeValues,
    });

    return this.mapPlanToResponse(updated);
  }

  async deletePlan(id: string): Promise<void> {
    const existing = await this.findPlanById(id);
    if (!existing) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }

    await this.databaseService.delete(
      `${this.planEntityType}#${id}`,
      `${this.planEntityType}#${id}`,
    );
  }

  // ============================================
  // User Subscription Methods
  // ============================================

  async createUserSubscription(
    dto: CreateUserSubscriptionDto,
    userEmail: string,
  ): Promise<UserSubscriptionResponseDto> {
    const plan = await this.findPlanById(dto.planId);
    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID ${dto.planId} not found`);
    }

    const id = uuidv4();
    const now = new Date();
    const endDate = this.calculateEndDate(now, plan.billingCycle);

    const subscription: UserSubscriptionEntity = {
      PK: `${this.userSubEntityType}#${id}`,
      SK: `${this.userSubEntityType}#${id}`,
      GSI1PK: `USER#${dto.userId}`,
      GSI1SK: `${this.userSubEntityType}#${now.toISOString()}`,
      GSI2PK: this.userSubEntityType,
      GSI2SK: `STATUS#${SubscriptionStatus.ACTIVE}#${now.toISOString()}`,
      id,
      userId: dto.userId,
      userEmail,
      planId: plan.id,
      planName: plan.name,
      planType: plan.planType,
      pricePaid: plan.price,
      status: plan.price === 0 ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PAYMENT_PENDING,
      paymentMethod: dto.paymentMethod || plan.paymentMethod,
      razorpaySubscriptionId: dto.razorpaySubscriptionId,
      razorpayPaymentId: dto.razorpayPaymentId,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      nextBillingDate: plan.autopayEnabled ? endDate.toISOString() : undefined,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await this.databaseService.put(subscription);
    return this.mapUserSubscriptionToResponse(subscription);
  }

  async findUserSubscriptions(userId: string): Promise<UserSubscriptionListResponseDto> {
    const result = await this.databaseService.query<UserSubscriptionEntity>(this.userSubEntityType, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      expressionAttributeValues: {
        ':pk': `USER#${userId}`,
      },
      scanIndexForward: false, // Latest first
    });

    return {
      items: result.items.map(this.mapUserSubscriptionToResponse),
      count: result.items.length,
    };
  }

  async findActiveUserSubscription(userId: string): Promise<UserSubscriptionResponseDto | null> {
    const result = await this.databaseService.query<UserSubscriptionEntity>(this.userSubEntityType, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      filterExpression: '#status = :status',
      expressionAttributeNames: {
        '#status': 'status',
      },
      expressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':status': SubscriptionStatus.ACTIVE,
      },
      scanIndexForward: false,
      limit: 1,
    });

    if (result.items.length === 0) {
      return null;
    }

    return this.mapUserSubscriptionToResponse(result.items[0]);
  }

  async findSubscriptionById(id: string): Promise<UserSubscriptionResponseDto> {
    const subscription = await this.databaseService.get<UserSubscriptionEntity>(
      `${this.userSubEntityType}#${id}`,
      `${this.userSubEntityType}#${id}`,
    );

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    return this.mapUserSubscriptionToResponse(subscription);
  }

  async findAllSubscriptions(filters: {
    status?: SubscriptionStatus;
    planType?: SubscriptionPlanType;
    limit?: number;
  }): Promise<UserSubscriptionListResponseDto> {
    let filterExpression: string | undefined;
    const expressionAttributeValues: Record<string, any> = {
      ':pk': this.userSubEntityType,
    };
    const expressionAttributeNames: Record<string, string> = {};

    if (filters.status) {
      filterExpression = '#status = :status';
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = filters.status;
    }

    if (filters.planType) {
      const planTypeFilter = 'planType = :planType';
      filterExpression = filterExpression ? `${filterExpression} AND ${planTypeFilter}` : planTypeFilter;
      expressionAttributeValues[':planType'] = filters.planType;
    }

    const result = await this.databaseService.query<UserSubscriptionEntity>(this.userSubEntityType, {
      indexName: 'GSI2',
      keyConditionExpression: 'GSI2PK = :pk',
      filterExpression,
      expressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      expressionAttributeValues,
      scanIndexForward: false,
      limit: filters.limit || 100,
    });

    return {
      items: result.items.map(this.mapUserSubscriptionToResponse),
      count: result.items.length,
    };
  }

  async updateUserSubscription(
    id: string,
    dto: UpdateUserSubscriptionDto,
  ): Promise<UserSubscriptionResponseDto> {
    const existing = await this.findSubscriptionById(id);
    if (!existing) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (dto.status !== undefined) {
      updateExpressions.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = dto.status;
    }

    if (dto.razorpaySubscriptionId !== undefined) {
      updateExpressions.push('razorpaySubscriptionId = :razorpaySubscriptionId');
      expressionAttributeValues[':razorpaySubscriptionId'] = dto.razorpaySubscriptionId;
    }

    if (dto.razorpayPaymentId !== undefined) {
      updateExpressions.push('razorpayPaymentId = :razorpayPaymentId');
      expressionAttributeValues[':razorpayPaymentId'] = dto.razorpayPaymentId;
    }

    if (dto.adminNotes !== undefined) {
      updateExpressions.push('adminNotes = :adminNotes');
      expressionAttributeValues[':adminNotes'] = dto.adminNotes;
    }

    updateExpressions.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const updated = await this.databaseService.update<UserSubscriptionEntity>(this.userSubEntityType, {
      key: {
        PK: `${this.userSubEntityType}#${id}`,
        SK: `${this.userSubEntityType}#${id}`,
      },
      updateExpression: `SET ${updateExpressions.join(', ')}`,
      expressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      expressionAttributeValues,
    });

    return this.mapUserSubscriptionToResponse(updated);
  }

  async activateSubscription(id: string, paymentId?: string): Promise<UserSubscriptionResponseDto> {
    return this.updateUserSubscription(id, {
      status: SubscriptionStatus.ACTIVE,
      razorpayPaymentId: paymentId,
    });
  }

  async cancelSubscription(id: string, reason?: string): Promise<UserSubscriptionResponseDto> {
    return this.updateUserSubscription(id, {
      status: SubscriptionStatus.CANCELLED,
      adminNotes: reason,
    });
  }

  // ============================================
  // Subscription Content Methods
  // ============================================

  async createContent(dto: CreateSubscriptionContentDto): Promise<SubscriptionContentResponseDto> {
    // Verify plan exists
    await this.findPlanById(dto.planId);

    const id = uuidv4();
    const locale = dto.locale || 'en';

    const content: SubscriptionContentEntity = {
      PK: `${this.contentEntityType}#${id}`,
      SK: `${this.contentEntityType}#${locale}`,
      GSI1PK: `PLAN#${dto.planId}`,
      GSI1SK: `${this.contentEntityType}#${dto.contentType}#${String(dto.displayOrder || 0).padStart(3, '0')}`,
      id,
      planId: dto.planId,
      contentType: dto.contentType,
      title: dto.title,
      description: dto.description,
      fileUrl: dto.fileUrl,
      thumbnailUrl: dto.thumbnailUrl,
      duration: dto.duration,
      displayOrder: dto.displayOrder || 0,
      locale,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.databaseService.put(content);
    return this.mapContentToResponse(content);
  }

  async findContentByPlan(
    planId: string,
    contentType?: ContentType,
    locale?: string,
  ): Promise<SubscriptionContentListResponseDto> {
    let filterExpression: string | undefined;
    const expressionAttributeValues: Record<string, any> = {
      ':pk': `PLAN#${planId}`,
    };

    if (contentType) {
      filterExpression = 'contentType = :contentType';
      expressionAttributeValues[':contentType'] = contentType;
    }

    if (locale) {
      const localeFilter = 'locale = :locale';
      filterExpression = filterExpression ? `${filterExpression} AND ${localeFilter}` : localeFilter;
      expressionAttributeValues[':locale'] = locale;
    }

    const result = await this.databaseService.query<SubscriptionContentEntity>(this.contentEntityType, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      filterExpression,
      expressionAttributeValues,
      scanIndexForward: true,
    });

    return {
      items: result.items.map(this.mapContentToResponse),
      count: result.items.length,
    };
  }

  async findContentById(id: string, locale = 'en'): Promise<SubscriptionContentResponseDto> {
    const content = await this.databaseService.get<SubscriptionContentEntity>(
      `${this.contentEntityType}#${id}`,
      `${this.contentEntityType}#${locale}`,
    );

    if (!content) {
      throw new NotFoundException(`Subscription content with ID ${id} not found`);
    }

    return this.mapContentToResponse(content);
  }

  async updateContent(
    id: string,
    dto: UpdateSubscriptionContentDto,
    locale = 'en',
  ): Promise<SubscriptionContentResponseDto> {
    const existing = await this.findContentById(id, locale);
    if (!existing) {
      throw new NotFoundException(`Subscription content with ID ${id} not found`);
    }

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    const fieldsToUpdate = ['title', 'description', 'fileUrl', 'thumbnailUrl', 'duration', 'displayOrder'];

    for (const field of fieldsToUpdate) {
      if ((dto as any)[field] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = (dto as any)[field];
      }
    }

    updateExpressions.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const updated = await this.databaseService.update<SubscriptionContentEntity>(this.contentEntityType, {
      key: {
        PK: `${this.contentEntityType}#${id}`,
        SK: `${this.contentEntityType}#${locale}`,
      },
      updateExpression: `SET ${updateExpressions.join(', ')}`,
      expressionAttributeNames,
      expressionAttributeValues,
    });

    return this.mapContentToResponse(updated);
  }

  async deleteContent(id: string, locale = 'en'): Promise<void> {
    const existing = await this.findContentById(id, locale);
    if (!existing) {
      throw new NotFoundException(`Subscription content with ID ${id} not found`);
    }

    await this.databaseService.delete(
      `${this.contentEntityType}#${id}`,
      `${this.contentEntityType}#${locale}`,
    );
  }

  // ============================================
  // Utility Methods
  // ============================================

  async canUserAccessContent(userId: string, planId: string): Promise<boolean> {
    const activeSubscription = await this.findActiveUserSubscription(userId);
    if (!activeSubscription) {
      return false;
    }

    // Check if user's plan includes the requested content's plan
    // For now, simple check if the plan matches
    // Could be extended to check plan hierarchy
    return activeSubscription.planId === planId;
  }

  async getUserAccessibleContent(userId: string): Promise<SubscriptionContentListResponseDto> {
    const activeSubscription = await this.findActiveUserSubscription(userId);
    if (!activeSubscription) {
      // Return free content only
      const freePlan = await this.findPlanByType(SubscriptionPlanType.FREE);
      if (freePlan) {
        return this.findContentByPlan(freePlan.id);
      }
      return { items: [], count: 0 };
    }

    return this.findContentByPlan(activeSubscription.planId);
  }

  private calculateEndDate(startDate: Date, billingCycle: BillingCycle): Date {
    const endDate = new Date(startDate);
    
    switch (billingCycle) {
      case BillingCycle.WEEKLY:
        endDate.setDate(endDate.getDate() + 7);
        break;
      case BillingCycle.MONTHLY:
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case BillingCycle.QUARTERLY:
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case BillingCycle.HALF_YEARLY:
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case BillingCycle.YEARLY:
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      case BillingCycle.ONE_TIME:
        // Lifetime access
        endDate.setFullYear(endDate.getFullYear() + 100);
        break;
    }

    return endDate;
  }

  private mapPlanToResponse(plan: SubscriptionPlanEntity): SubscriptionPlanResponseDto {
    return {
      id: plan.id,
      planType: plan.planType,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      billingCycle: plan.billingCycle,
      paymentMethod: plan.paymentMethod,
      autopayEnabled: plan.autopayEnabled,
      contents: plan.contents,
      guidance: plan.guidance,
      features: plan.features,
      isActive: plan.isActive,
      displayOrder: plan.displayOrder,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }

  private mapUserSubscriptionToResponse(sub: UserSubscriptionEntity): UserSubscriptionResponseDto {
    return {
      id: sub.id,
      userId: sub.userId,
      userEmail: sub.userEmail,
      planId: sub.planId,
      planName: sub.planName,
      planType: sub.planType,
      pricePaid: sub.pricePaid,
      status: sub.status,
      paymentMethod: sub.paymentMethod,
      razorpaySubscriptionId: sub.razorpaySubscriptionId,
      razorpayPaymentId: sub.razorpayPaymentId,
      startDate: sub.startDate,
      endDate: sub.endDate,
      nextBillingDate: sub.nextBillingDate,
      adminNotes: sub.adminNotes,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    };
  }

  private mapContentToResponse(content: SubscriptionContentEntity): SubscriptionContentResponseDto {
    return {
      id: content.id,
      planId: content.planId,
      contentType: content.contentType,
      title: content.title,
      description: content.description,
      fileUrl: content.fileUrl,
      thumbnailUrl: content.thumbnailUrl,
      duration: content.duration,
      displayOrder: content.displayOrder,
      locale: content.locale,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
    };
  }
}
