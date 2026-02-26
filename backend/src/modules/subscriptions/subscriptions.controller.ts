import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
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
  SubscriptionStatus,
  SubscriptionPlanType,
  ContentType,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import {
  Public,
  AdminOnly,
  SuperAdminOnly,
  CurrentUser,
  CurrentUserData,
} from '@/common/decorators';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // ============================================
  // Subscription Plans Endpoints
  // ============================================

  @Post('plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a subscription plan (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Plan created successfully',
    type: SubscriptionPlanResponseDto,
  })
  async createPlan(
    @Body() createPlanDto: CreateSubscriptionPlanDto,
  ): Promise<SubscriptionPlanResponseDto> {
    return this.subscriptionsService.createPlan(createPlanDto);
  }

  @Get('plans')
  @Public()
  @ApiOperation({ summary: 'Get all subscription plans' })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Filter active plans only',
  })
  @ApiResponse({
    status: 200,
    description: 'List of subscription plans',
    type: SubscriptionPlanListResponseDto,
  })
  async findAllPlans(
    @Query('activeOnly') activeOnly?: boolean,
  ): Promise<SubscriptionPlanListResponseDto> {
    return this.subscriptionsService.findAllPlans(
      activeOnly === true || activeOnly === ('true' as any),
    );
  }

  @Get('plans/:id')
  @Public()
  @ApiOperation({ summary: 'Get subscription plan by ID' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({
    status: 200,
    description: 'Plan found',
    type: SubscriptionPlanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async findPlanById(@Param('id') id: string): Promise<SubscriptionPlanResponseDto> {
    return this.subscriptionsService.findPlanById(id);
  }

  @Put('plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update subscription plan (Admin only)' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({
    status: 200,
    description: 'Plan updated successfully',
    type: SubscriptionPlanResponseDto,
  })
  async updatePlan(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdateSubscriptionPlanDto,
  ): Promise<SubscriptionPlanResponseDto> {
    return this.subscriptionsService.updatePlan(id, updatePlanDto);
  }

  @Delete('plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @SuperAdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete subscription plan (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 200, description: 'Plan deleted successfully' })
  async deletePlan(@Param('id') id: string): Promise<void> {
    return this.subscriptionsService.deletePlan(id);
  }

  // ============================================
  // User Subscription Endpoints
  // ============================================

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Subscribe to a plan' })
  @ApiResponse({
    status: 201,
    description: 'Subscription created successfully',
    type: UserSubscriptionResponseDto,
  })
  async subscribe(
    @Body() createSubscriptionDto: CreateUserSubscriptionDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<UserSubscriptionResponseDto> {
    // Override userId with the current user's ID for security
    createSubscriptionDto.userId = user.sub;
    return this.subscriptionsService.createUserSubscription(createSubscriptionDto, user.email);
  }

  @Get('my-subscriptions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user subscriptions' })
  @ApiResponse({
    status: 200,
    description: 'User subscriptions',
    type: UserSubscriptionListResponseDto,
  })
  async getMySubscriptions(
    @CurrentUser() user: CurrentUserData,
  ): Promise<UserSubscriptionListResponseDto> {
    return this.subscriptionsService.findUserSubscriptions(user.sub);
  }

  @Get('my-subscription/active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user active subscription' })
  @ApiResponse({
    status: 200,
    description: 'Active subscription or null',
    type: UserSubscriptionResponseDto,
  })
  async getMyActiveSubscription(
    @CurrentUser() user: CurrentUserData,
  ): Promise<UserSubscriptionResponseDto | null> {
    return this.subscriptionsService.findActiveUserSubscription(user.sub);
  }

  @Get('my-content')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get content accessible to current user' })
  @ApiQuery({ name: 'contentType', required: false, enum: ContentType })
  @ApiQuery({ name: 'locale', required: false })
  @ApiResponse({
    status: 200,
    description: 'Accessible content list',
    type: SubscriptionContentListResponseDto,
  })
  async getMyContent(
    @CurrentUser() user: CurrentUserData,
  ): Promise<SubscriptionContentListResponseDto> {
    return this.subscriptionsService.getUserAccessibleContent(user.sub);
  }

  // ============================================
  // Admin Subscription Management
  // ============================================

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all user subscriptions (Admin only)' })
  @ApiQuery({ name: 'status', required: false, enum: SubscriptionStatus })
  @ApiQuery({ name: 'planType', required: false, enum: SubscriptionPlanType })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'All user subscriptions',
    type: UserSubscriptionListResponseDto,
  })
  async findAllSubscriptions(
    @Query('status') status?: SubscriptionStatus,
    @Query('planType') planType?: SubscriptionPlanType,
    @Query('limit') limit?: number,
  ): Promise<UserSubscriptionListResponseDto> {
    return this.subscriptionsService.findAllSubscriptions({ status, planType, limit });
  }

  @Get('admin/user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user subscriptions by user ID (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User subscriptions',
    type: UserSubscriptionListResponseDto,
  })
  async findUserSubscriptions(
    @Param('userId') userId: string,
  ): Promise<UserSubscriptionListResponseDto> {
    return this.subscriptionsService.findUserSubscriptions(userId);
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get subscription by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription details',
    type: UserSubscriptionResponseDto,
  })
  async findSubscriptionById(@Param('id') id: string): Promise<UserSubscriptionResponseDto> {
    return this.subscriptionsService.findSubscriptionById(id);
  }

  @Put('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update user subscription (Admin only)' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription updated',
    type: UserSubscriptionResponseDto,
  })
  async updateSubscription(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserSubscriptionDto,
  ): Promise<UserSubscriptionResponseDto> {
    return this.subscriptionsService.updateUserSubscription(id, updateDto);
  }

  @Post('admin/:id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Activate subscription (Admin only)' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription activated',
    type: UserSubscriptionResponseDto,
  })
  async activateSubscription(@Param('id') id: string): Promise<UserSubscriptionResponseDto> {
    return this.subscriptionsService.activateSubscription(id);
  }

  @Post('admin/:id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel subscription (Admin only)' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription cancelled',
    type: UserSubscriptionResponseDto,
  })
  async cancelSubscription(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ): Promise<UserSubscriptionResponseDto> {
    return this.subscriptionsService.cancelSubscription(id, reason);
  }

  // ============================================
  // Subscription Content Endpoints
  // ============================================

  @Post('content')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add content to subscription plan (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Content created successfully',
    type: SubscriptionContentResponseDto,
  })
  async createContent(
    @Body() createContentDto: CreateSubscriptionContentDto,
  ): Promise<SubscriptionContentResponseDto> {
    return this.subscriptionsService.createContent(createContentDto);
  }

  @Get('content/plan/:planId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get content for a subscription plan' })
  @ApiParam({ name: 'planId', description: 'Plan ID' })
  @ApiQuery({ name: 'contentType', required: false, enum: ContentType })
  @ApiQuery({ name: 'locale', required: false })
  @ApiResponse({
    status: 200,
    description: 'Content list',
    type: SubscriptionContentListResponseDto,
  })
  async findContentByPlan(
    @Param('planId') planId: string,
    @Query('contentType') contentType?: ContentType,
    @Query('locale') locale?: string,
  ): Promise<SubscriptionContentListResponseDto> {
    return this.subscriptionsService.findContentByPlan(planId, contentType, locale);
  }

  @Get('content/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get content by ID' })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @ApiQuery({ name: 'locale', required: false })
  @ApiResponse({
    status: 200,
    description: 'Content found',
    type: SubscriptionContentResponseDto,
  })
  async findContentById(
    @Param('id') id: string,
    @Query('locale') locale?: string,
  ): Promise<SubscriptionContentResponseDto> {
    return this.subscriptionsService.findContentById(id, locale);
  }

  @Put('content/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update subscription content (Admin only)' })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @ApiQuery({ name: 'locale', required: false })
  @ApiResponse({
    status: 200,
    description: 'Content updated',
    type: SubscriptionContentResponseDto,
  })
  async updateContent(
    @Param('id') id: string,
    @Body() updateContentDto: UpdateSubscriptionContentDto,
    @Query('locale') locale?: string,
  ): Promise<SubscriptionContentResponseDto> {
    return this.subscriptionsService.updateContent(id, updateContentDto, locale);
  }

  @Delete('content/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete subscription content (Admin only)' })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @ApiQuery({ name: 'locale', required: false })
  @ApiResponse({ status: 200, description: 'Content deleted' })
  async deleteContent(@Param('id') id: string, @Query('locale') locale?: string): Promise<void> {
    return this.subscriptionsService.deleteContent(id, locale);
  }

  // ============================================
  // Public Content Endpoints (No Auth Required)
  // ============================================

  @Get('public/content/:contentType')
  @Public()
  @ApiOperation({
    summary: 'Get free-tier content by type (public)',
    description:
      'Returns content of the specified type from the free subscription plan. No authentication required.',
  })
  @ApiParam({ name: 'contentType', enum: ContentType, description: 'Type of content (stotra, kavach, etc.)' })
  @ApiQuery({ name: 'locale', required: false })
  @ApiResponse({
    status: 200,
    description: 'Free tier content list',
    type: SubscriptionContentListResponseDto,
  })
  async getPublicContentByType(
    @Param('contentType') contentType: ContentType,
    @Query('locale') locale?: string,
  ): Promise<SubscriptionContentListResponseDto> {
    return this.subscriptionsService.getPublicContentByType(contentType, locale);
  }
}
