import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { MonthlyScheduleService } from './monthly-schedule.service';
import {
  CreateMonthlyScheduleDto,
  UpdateMonthlyScheduleDto,
  MonthlyScheduleResponseDto,
  MonthlyScheduleListResponseDto,
  UserMonthlyContentResponseDto,
  UserMonthlyOverviewResponseDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import {
  Public,
  AdminOnly,
  CurrentUser,
  CurrentUserData,
} from '@/common/decorators';

@ApiTags('Monthly Content Schedule')
@Controller('subscriptions/schedules')
export class MonthlyScheduleController {
  constructor(private readonly scheduleService: MonthlyScheduleService) {}

  // ============================================
  // Admin Endpoints
  // ============================================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a monthly content schedule (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Schedule created successfully',
    type: MonthlyScheduleResponseDto,
  })
  async createSchedule(
    @Body() dto: CreateMonthlyScheduleDto,
  ): Promise<MonthlyScheduleResponseDto> {
    return this.scheduleService.createSchedule(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all monthly schedules (Admin only)' })
  @ApiQuery({ name: 'planId', required: false, description: 'Filter by plan ID' })
  @ApiResponse({
    status: 200,
    description: 'List of monthly schedules',
    type: MonthlyScheduleListResponseDto,
  })
  async findAllSchedules(
    @Query('planId') planId?: string,
  ): Promise<MonthlyScheduleListResponseDto> {
    return this.scheduleService.findAllSchedules(planId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a monthly schedule by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiResponse({
    status: 200,
    description: 'Schedule found',
    type: MonthlyScheduleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async findScheduleById(
    @Param('id') id: string,
  ): Promise<MonthlyScheduleResponseDto> {
    return this.scheduleService.findScheduleById(id);
  }

  @Get('plan/:planId/:year/:month')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get schedule for a specific plan/year/month (Admin)' })
  @ApiParam({ name: 'planId', description: 'Plan ID' })
  @ApiParam({ name: 'year', description: 'Year (e.g. 2026)' })
  @ApiParam({ name: 'month', description: 'Month (1-12)' })
  @ApiResponse({
    status: 200,
    description: 'Schedule found or null',
    type: MonthlyScheduleResponseDto,
  })
  async findScheduleByPlanAndMonth(
    @Param('planId') planId: string,
    @Param('year') year: string,
    @Param('month') month: string,
  ): Promise<MonthlyScheduleResponseDto | null> {
    return this.scheduleService.findScheduleByPlanAndMonth(
      planId,
      parseInt(year, 10),
      parseInt(month, 10),
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a monthly schedule (Admin only)' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiResponse({
    status: 200,
    description: 'Schedule updated',
    type: MonthlyScheduleResponseDto,
  })
  async updateSchedule(
    @Param('id') id: string,
    @Body() dto: UpdateMonthlyScheduleDto,
  ): Promise<MonthlyScheduleResponseDto> {
    return this.scheduleService.updateSchedule(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a monthly schedule (Admin only)' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiResponse({ status: 204, description: 'Schedule deleted' })
  async deleteSchedule(@Param('id') id: string): Promise<void> {
    return this.scheduleService.deleteSchedule(id);
  }

  // ============================================
  // User-Facing Endpoints
  // ============================================

  @Get('my/overview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get monthly overview for current user\'s subscription',
    description:
      'Returns all published monthly schedules for the user\'s active subscription plan, with content details per month.',
  })
  @ApiResponse({
    status: 200,
    description: 'Monthly overview or null if no active subscription',
    type: UserMonthlyOverviewResponseDto,
  })
  async getMyMonthlyOverview(
    @CurrentUser() user: CurrentUserData,
  ): Promise<UserMonthlyOverviewResponseDto | null> {
    return this.scheduleService.getUserMonthlyOverview(user.sub);
  }

  @Get('my/:year/:month')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get content for a specific month of current user\'s subscription',
    description:
      'Returns the content items available for a specific month under the user\'s active subscription.',
  })
  @ApiParam({ name: 'year', description: 'Year (e.g. 2026)' })
  @ApiParam({ name: 'month', description: 'Month (1-12)' })
  @ApiResponse({
    status: 200,
    description: 'Monthly content or null',
    type: UserMonthlyContentResponseDto,
  })
  async getMyMonthContent(
    @CurrentUser() user: CurrentUserData,
    @Param('year') year: string,
    @Param('month') month: string,
  ): Promise<UserMonthlyContentResponseDto | null> {
    return this.scheduleService.getUserMonthContent(
      user.sub,
      parseInt(year, 10),
      parseInt(month, 10),
    );
  }
}
