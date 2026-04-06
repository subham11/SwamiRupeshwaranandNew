import { Injectable, Inject, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService, DATABASE_SERVICE } from '@/common/database';
import {
  LogActivityDto,
  ActivityLogResponseDto,
  ActivityLogListResponseDto,
  ActivityLogStatsDto,
  ActivityEntityType,
} from './dto';

// ============================================
// Entity Interface (DynamoDB Single-Table)
// ============================================

interface ActivityLogEntity {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  GSI2PK: string;
  GSI2SK: string;
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  entityType: ActivityEntityType;
  entityId: string;
  details: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);
  private readonly entityName = 'ACTIVITY';

  constructor(
    @Inject(DATABASE_SERVICE)
    private readonly databaseService: DatabaseService,
  ) {}

  // ============================================
  // Log Activity (fire-and-forget, never throws)
  // ============================================

  async log(data: LogActivityDto): Promise<void> {
    try {
      const id = uuidv4();
      const now = new Date().toISOString();

      const entity: ActivityLogEntity = {
        PK: `${this.entityName}#${id}`,
        SK: `${this.entityName}#${id}`,
        GSI1PK: this.entityName,
        GSI1SK: `DATE#${now}`,
        GSI2PK: `ACTIVITY_USER#${data.userId}`,
        GSI2SK: `DATE#${now}`,
        id,
        userId: data.userId,
        userEmail: data.userEmail,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        details: data.details,
        metadata: data.metadata,
        ipAddress: data.ipAddress,
        createdAt: now,
      };

      await this.databaseService.put(entity);
    } catch (error) {
      // Fire-and-forget: log error but never throw
      this.logger.error(
        `Failed to log activity: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  // ============================================
  // Query Recent Logs (GSI1 - sorted by date)
  // ============================================

  async getRecentLogs(limit = 20, cursor?: string): Promise<ActivityLogListResponseDto> {
    const exclusiveStartKey = cursor
      ? JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'))
      : undefined;

    const result = await this.databaseService.query<ActivityLogEntity>(this.entityName, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      expressionAttributeValues: { ':pk': this.entityName },
      limit,
      exclusiveStartKey,
      scanIndexForward: false, // newest first
    });

    const nextCursor = result.lastKey
      ? Buffer.from(JSON.stringify(result.lastKey)).toString('base64')
      : undefined;

    return {
      items: result.items.map((item) => this.mapToResponse(item)),
      cursor: nextCursor,
      total: result.items.length,
    };
  }

  // ============================================
  // Query Logs by User (GSI2)
  // ============================================

  async getLogsByUser(
    userId: string,
    limit = 20,
    cursor?: string,
  ): Promise<ActivityLogListResponseDto> {
    const exclusiveStartKey = cursor
      ? JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'))
      : undefined;

    const result = await this.databaseService.query<ActivityLogEntity>(this.entityName, {
      indexName: 'GSI2',
      keyConditionExpression: 'GSI2PK = :pk',
      expressionAttributeValues: { ':pk': `ACTIVITY_USER#${userId}` },
      limit,
      exclusiveStartKey,
      scanIndexForward: false,
    });

    const nextCursor = result.lastKey
      ? Buffer.from(JSON.stringify(result.lastKey)).toString('base64')
      : undefined;

    return {
      items: result.items.map((item) => this.mapToResponse(item)),
      cursor: nextCursor,
      total: result.items.length,
    };
  }

  // ============================================
  // Query Logs by Entity (scan with filter)
  // ============================================

  async getLogsByEntity(
    entityType: ActivityEntityType,
    entityId?: string,
    limit = 50,
  ): Promise<ActivityLogListResponseDto> {
    const filter: Record<string, any> = { entityType };
    if (entityId) {
      filter.entityId = entityId;
    }

    const items = await this.databaseService.scan<ActivityLogEntity>(this.entityName, filter);

    // Sort by createdAt descending and limit
    const sorted = items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);

    return {
      items: sorted.map((item) => this.mapToResponse(item)),
      cursor: undefined,
      total: sorted.length,
    };
  }

  // ============================================
  // Activity Stats
  // ============================================

  async getStats(): Promise<ActivityLogStatsDto> {
    const allItems = await this.databaseService.scan<ActivityLogEntity>(this.entityName);

    const byEntityType: Record<string, number> = {};
    const byAction: Record<string, number> = {};
    const todayUsers = new Set<string>();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();

    for (const item of allItems) {
      // Count by entity type
      byEntityType[item.entityType] = (byEntityType[item.entityType] || 0) + 1;

      // Count by action
      byAction[item.action] = (byAction[item.action] || 0) + 1;

      // Active users today
      if (item.createdAt >= todayIso) {
        todayUsers.add(item.userId);
      }
    }

    return {
      total: allItems.length,
      byEntityType,
      byAction,
      activeUsersToday: todayUsers.size,
    };
  }

  // ============================================
  // Mapper
  // ============================================

  private mapToResponse(entity: ActivityLogEntity): ActivityLogResponseDto {
    return {
      id: entity.id,
      userId: entity.userId,
      userEmail: entity.userEmail,
      action: entity.action,
      entityType: entity.entityType,
      entityId: entity.entityId,
      details: entity.details,
      metadata: entity.metadata,
      ipAddress: entity.ipAddress,
      createdAt: entity.createdAt,
    };
  }
}
