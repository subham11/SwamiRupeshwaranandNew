import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
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
} from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import {
  CreateCouponDto,
  UpdateCouponDto,
  ValidateCouponDto,
  ValidateCouponResponseDto,
  ApplyCouponDto,
  CouponResponseDto,
  CouponStatsDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { AdminOnly, CurrentUser, CurrentUserData } from '@/common/decorators';

@ApiTags('Coupons')
@Controller('coupons')
@ApiBearerAuth('JWT-auth')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // ============================================
  // Admin Endpoints
  // ============================================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiOperation({ summary: 'Create a new coupon (Admin only)' })
  @ApiResponse({ status: 201, description: 'Coupon created', type: CouponResponseDto })
  async createCoupon(@Body() dto: CreateCouponDto): Promise<CouponResponseDto> {
    return this.couponsService.createCoupon(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiOperation({ summary: 'Update a coupon (Admin only)' })
  @ApiParam({ name: 'id', description: 'Coupon ID' })
  @ApiResponse({ status: 200, description: 'Coupon updated', type: CouponResponseDto })
  async updateCoupon(
    @Param('id') id: string,
    @Body() dto: UpdateCouponDto,
  ): Promise<CouponResponseDto> {
    return this.couponsService.updateCoupon(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a coupon (Admin only)' })
  @ApiParam({ name: 'id', description: 'Coupon ID' })
  @ApiResponse({ status: 204, description: 'Coupon deleted' })
  async deleteCoupon(@Param('id') id: string): Promise<void> {
    return this.couponsService.deleteCoupon(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiOperation({ summary: 'List all coupons (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of coupons', type: [CouponResponseDto] })
  async listCoupons(): Promise<CouponResponseDto[]> {
    return this.couponsService.listCoupons();
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiOperation({ summary: 'Get coupon usage stats (Admin only)' })
  @ApiParam({ name: 'id', description: 'Coupon ID' })
  @ApiResponse({ status: 200, description: 'Coupon statistics', type: CouponStatsDto })
  async getCouponStats(@Param('id') id: string): Promise<CouponStatsDto> {
    return this.couponsService.getCouponStats(id);
  }

  // ============================================
  // User Endpoints
  // ============================================

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a coupon code' })
  @ApiResponse({ status: 200, description: 'Validation result', type: ValidateCouponResponseDto })
  async validateCoupon(
    @Body() dto: ValidateCouponDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ValidateCouponResponseDto> {
    return this.couponsService.validateCoupon(dto.code, user.sub, dto.cartTotal);
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply a coupon to an order' })
  @ApiResponse({ status: 200, description: 'Coupon applied', type: ValidateCouponResponseDto })
  async applyCoupon(
    @Body() dto: ApplyCouponDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ValidateCouponResponseDto> {
    return this.couponsService.applyCoupon(dto.code, user.sub, dto.orderId, dto.cartTotal);
  }
}
