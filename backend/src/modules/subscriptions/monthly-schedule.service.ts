import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService, DATABASE_SERVICE } from '@/common/database';
import { SubscriptionsService } from './subscriptions.service';
import {
  CreateMonthlyScheduleDto,
  UpdateMonthlyScheduleDto,
  MonthlyScheduleResponseDto,
  MonthlyScheduleListResponseDto,
  MonthlyScheduleContentItemResponseDto,
  UserMonthlyContentResponseDto,
  UserMonthlyOverviewResponseDto,
  ContentType,
  SubscriptionStatus,
} from './dto';

// ============================================
// Entity Interface
// ============================================
interface MonthlyScheduleEntity {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  GSI2PK: string;
  GSI2SK: string;
  id: string;
  planId: string;
  planName: string;
  year: number;
  month: number;
  title?: string;
  titleHi?: string;
  description?: string;
  descriptionHi?: string;
  /** Array of { contentId, displayOrder } */
  contentItems: Array<{ contentId: string; displayOrder: number }>;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionContentEntity {
  PK: string;
  SK: string;
  id: string;
  planId: string;
  contentType: ContentType;
  title: string;
  titleHi?: string;
  description?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  displayOrder: number;
  locale: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

const MONTH_NAMES = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

@Injectable()
export class MonthlyScheduleService {
  private readonly logger = new Logger(MonthlyScheduleService.name);
  private readonly entityType = 'CONTENT_SCHEDULE';
  private readonly contentEntityType = 'SUBSCRIPTION_CONTENT';

  constructor(
    @Inject(DATABASE_SERVICE)
    private readonly databaseService: DatabaseService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  // ============================================
  // Admin CRUD Methods
  // ============================================

  async createSchedule(dto: CreateMonthlyScheduleDto): Promise<MonthlyScheduleResponseDto> {
    // Verify plan exists
    const plan = await this.subscriptionsService.findPlanById(dto.planId);

    // Check if schedule already exists for this plan/year/month
    const existing = await this.findScheduleByPlanAndMonth(dto.planId, dto.year, dto.month);
    if (existing) {
      throw new BadRequestException(
        `Schedule already exists for plan "${plan.name}" for ${MONTH_NAMES[dto.month]} ${dto.year}. Use update instead.`,
      );
    }

    const id = uuidv4();
    const monthStr = String(dto.month).padStart(2, '0');

    const entity: MonthlyScheduleEntity = {
      PK: `${this.entityType}#${id}`,
      SK: `${this.entityType}#${id}`,
      GSI1PK: `PLAN_SCHEDULE#${dto.planId}`,
      GSI1SK: `${dto.year}#${monthStr}`,
      GSI2PK: this.entityType,
      GSI2SK: `${dto.year}#${monthStr}#${dto.planId}`,
      id,
      planId: dto.planId,
      planName: plan.name,
      year: dto.year,
      month: dto.month,
      title: dto.title || `${MONTH_NAMES[dto.month]} ${dto.year} Collection`,
      titleHi: dto.titleHi,
      description: dto.description,
      descriptionHi: dto.descriptionHi,
      contentItems: (dto.contentItems || []).map((item, index) => ({
        contentId: item.contentId,
        displayOrder: item.displayOrder ?? index + 1,
      })),
      isPublished: dto.isPublished ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.databaseService.put(entity);
    return this.enrichScheduleResponse(entity);
  }

  async findAllSchedules(planId?: string): Promise<MonthlyScheduleListResponseDto> {
    let result;

    if (planId) {
      // Query by plan
      result = await this.databaseService.query<MonthlyScheduleEntity>(this.entityType, {
        indexName: 'GSI1',
        keyConditionExpression: 'GSI1PK = :pk',
        expressionAttributeValues: {
          ':pk': `PLAN_SCHEDULE#${planId}`,
        },
        scanIndexForward: true,
      });
    } else {
      // Query all schedules
      result = await this.databaseService.query<MonthlyScheduleEntity>(this.entityType, {
        indexName: 'GSI2',
        keyConditionExpression: 'GSI2PK = :pk',
        expressionAttributeValues: {
          ':pk': this.entityType,
        },
        scanIndexForward: true,
      });
    }

    const items = await Promise.all(result.items.map((item) => this.enrichScheduleResponse(item)));

    return {
      items,
      count: items.length,
    };
  }

  async findScheduleById(id: string): Promise<MonthlyScheduleResponseDto> {
    const entity = await this.databaseService.get<MonthlyScheduleEntity>(
      `${this.entityType}#${id}`,
      `${this.entityType}#${id}`,
    );

    if (!entity) {
      throw new NotFoundException(`Monthly schedule with ID ${id} not found`);
    }

    return this.enrichScheduleResponse(entity);
  }

  async findScheduleByPlanAndMonth(
    planId: string,
    year: number,
    month: number,
  ): Promise<MonthlyScheduleResponseDto | null> {
    const monthStr = String(month).padStart(2, '0');

    const result = await this.databaseService.query<MonthlyScheduleEntity>(this.entityType, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
      expressionAttributeValues: {
        ':pk': `PLAN_SCHEDULE#${planId}`,
        ':sk': `${year}#${monthStr}`,
      },
    });

    if (result.items.length === 0) {
      return null;
    }

    return this.enrichScheduleResponse(result.items[0]);
  }

  async updateSchedule(
    id: string,
    dto: UpdateMonthlyScheduleDto,
  ): Promise<MonthlyScheduleResponseDto> {
    const existing = await this.databaseService.get<MonthlyScheduleEntity>(
      `${this.entityType}#${id}`,
      `${this.entityType}#${id}`,
    );

    if (!existing) {
      throw new NotFoundException(`Monthly schedule with ID ${id} not found`);
    }

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    const fieldsToUpdate = [
      'title',
      'titleHi',
      'description',
      'descriptionHi',
      'isPublished',
    ];

    for (const field of fieldsToUpdate) {
      if ((dto as any)[field] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = (dto as any)[field];
      }
    }

    // Handle contentItems separately (complex type)
    if (dto.contentItems !== undefined) {
      updateExpressions.push('contentItems = :contentItems');
      expressionAttributeValues[':contentItems'] = dto.contentItems.map((item, index) => ({
        contentId: item.contentId,
        displayOrder: item.displayOrder ?? index + 1,
      }));
    }

    updateExpressions.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    if (updateExpressions.length === 1) {
      return this.enrichScheduleResponse(existing);
    }

    const updated = await this.databaseService.update<MonthlyScheduleEntity>(this.entityType, {
      key: {
        PK: `${this.entityType}#${id}`,
        SK: `${this.entityType}#${id}`,
      },
      updateExpression: `SET ${updateExpressions.join(', ')}`,
      expressionAttributeNames:
        Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      expressionAttributeValues,
    });

    return this.enrichScheduleResponse(updated);
  }

  async deleteSchedule(id: string): Promise<void> {
    const existing = await this.databaseService.get<MonthlyScheduleEntity>(
      `${this.entityType}#${id}`,
      `${this.entityType}#${id}`,
    );

    if (!existing) {
      throw new NotFoundException(`Monthly schedule with ID ${id} not found`);
    }

    await this.databaseService.delete(
      `${this.entityType}#${id}`,
      `${this.entityType}#${id}`,
    );
  }

  // ============================================
  // User-Facing Methods
  // ============================================

  /**
   * Get monthly content overview for a user's active subscription.
   * Returns all published months with content details.
   */
  async getUserMonthlyOverview(userId: string): Promise<UserMonthlyOverviewResponseDto | null> {
    // Get user's active subscription
    const activeSubscription = await this.subscriptionsService.findActiveUserSubscription(userId);
    if (!activeSubscription) {
      return null;
    }

    const plan = await this.subscriptionsService.findPlanById(activeSubscription.planId);

    // Get all published schedules for this plan
    const result = await this.databaseService.query<MonthlyScheduleEntity>(this.entityType, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      filterExpression: 'isPublished = :published',
      expressionAttributeValues: {
        ':pk': `PLAN_SCHEDULE#${activeSubscription.planId}`,
        ':published': true,
      },
      scanIndexForward: true,
    });

    const months: UserMonthlyContentResponseDto[] = await Promise.all(
      result.items.map(async (schedule) => {
        const contentItems = await this.resolveContentItems(schedule.contentItems);
        return {
          year: schedule.year,
          month: schedule.month,
          monthName: MONTH_NAMES[schedule.month],
          title: schedule.title,
          description: schedule.description,
          contentItems,
          contentCount: contentItems.length,
          isAccessible: activeSubscription.status === SubscriptionStatus.ACTIVE,
        };
      }),
    );

    return {
      planName: plan.name,
      planId: plan.id,
      months,
      totalMonths: months.length,
    };
  }

  /**
   * Get content for a specific month for a user's subscription.
   * Verifies the user has active access before returning content.
   */
  async getUserMonthContent(
    userId: string,
    year: number,
    month: number,
  ): Promise<UserMonthlyContentResponseDto | null> {
    const activeSubscription = await this.subscriptionsService.findActiveUserSubscription(userId);
    if (!activeSubscription) {
      return null;
    }

    const schedule = await this.findScheduleByPlanAndMonth(
      activeSubscription.planId,
      year,
      month,
    );

    if (!schedule || !schedule.isPublished) {
      return null;
    }

    // Re-fetch raw entity to get contentItems with contentIds
    const monthStr = String(month).padStart(2, '0');
    const rawResult = await this.databaseService.query<MonthlyScheduleEntity>(this.entityType, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
      expressionAttributeValues: {
        ':pk': `PLAN_SCHEDULE#${activeSubscription.planId}`,
        ':sk': `${year}#${monthStr}`,
      },
    });

    if (rawResult.items.length === 0) {
      return null;
    }

    const entity = rawResult.items[0];
    const contentItems = await this.resolveContentItems(entity.contentItems);

    return {
      year,
      month,
      monthName: MONTH_NAMES[month],
      title: entity.title,
      description: entity.description,
      contentItems,
      contentCount: contentItems.length,
      isAccessible: activeSubscription.status === SubscriptionStatus.ACTIVE,
    };
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Resolve content IDs to full content details via batch get.
   */
  private async resolveContentItems(
    items: Array<{ contentId: string; displayOrder: number }>,
  ): Promise<MonthlyScheduleContentItemResponseDto[]> {
    if (!items || items.length === 0) {
      return [];
    }

    // Batch get all content items
    const keys = items.map((item) => ({
      PK: `${this.contentEntityType}#${item.contentId}`,
      SK: `${this.contentEntityType}#en`, // Default locale
    }));

    try {
      const contentEntities = await this.databaseService.batchGet<SubscriptionContentEntity>(keys);

      // Build a map for quick lookup
      const contentMap = new Map<string, SubscriptionContentEntity>();
      for (const entity of contentEntities) {
        contentMap.set(entity.id, entity);
      }

      // Map and sort by displayOrder
      return items
        .map((item) => {
          const content = contentMap.get(item.contentId);
          if (!content) {
            this.logger.warn(`Content ${item.contentId} not found in schedule`);
            return null;
          }
          return {
            contentId: content.id,
            title: content.title,
            titleHi: content.titleHi,
            contentType: content.contentType,
            fileUrl: content.fileUrl,
            thumbnailUrl: content.thumbnailUrl,
            displayOrder: item.displayOrder,
          };
        })
        .filter(Boolean) as MonthlyScheduleContentItemResponseDto[];
    } catch (error) {
      this.logger.error('Failed to resolve content items', error);
      return [];
    }
  }

  /**
   * Enrich a schedule entity with resolved content items.
   */
  private async enrichScheduleResponse(
    entity: MonthlyScheduleEntity,
  ): Promise<MonthlyScheduleResponseDto> {
    const contentItems = await this.resolveContentItems(entity.contentItems || []);

    return {
      id: entity.id,
      planId: entity.planId,
      planName: entity.planName,
      year: entity.year,
      month: entity.month,
      monthName: MONTH_NAMES[entity.month],
      title: entity.title,
      titleHi: entity.titleHi,
      description: entity.description,
      descriptionHi: entity.descriptionHi,
      contentItems,
      contentCount: contentItems.length,
      isPublished: entity.isPublished,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
