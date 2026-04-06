import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ActivityLogService } from './activity-log.service';
import { ActivityLogQueryDto, ActivityLogListResponseDto, ActivityLogStatsDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { AdminOnly } from '@/common/decorators';

@ApiTags('Activity Log')
@Controller('activity-log')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
@ApiBearerAuth('JWT-auth')
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  // ============================================
  // Get Recent Activity Logs
  // ============================================

  @Get()
  @ApiOperation({ summary: 'Get recent activity logs (Admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max items to return' })
  @ApiQuery({ name: 'cursor', required: false, description: 'Pagination cursor' })
  @ApiQuery({ name: 'entityType', required: false, description: 'Filter by entity type' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiResponse({ status: 200, type: ActivityLogListResponseDto })
  async getActivityLogs(@Query() query: ActivityLogQueryDto): Promise<ActivityLogListResponseDto> {
    const limit = query.limit || 20;

    // If userId is specified, query by user (GSI2)
    if (query.userId) {
      return this.activityLogService.getLogsByUser(query.userId, limit, query.cursor);
    }

    // If entityType is specified, filter by entity type (scan)
    if (query.entityType) {
      return this.activityLogService.getLogsByEntity(query.entityType, undefined, limit);
    }

    // Default: get recent logs (GSI1)
    return this.activityLogService.getRecentLogs(limit, query.cursor);
  }

  // ============================================
  // Get Activity Stats
  // ============================================

  @Get('stats')
  @ApiOperation({ summary: 'Get activity log statistics (Admin only)' })
  @ApiResponse({ status: 200, type: ActivityLogStatsDto })
  async getStats(): Promise<ActivityLogStatsDto> {
    return this.activityLogService.getStats();
  }
}
