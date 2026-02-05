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
  Request,
} from '@nestjs/common';
import { DonationService } from './donation.service';
import {
  CreateDonationConfigDto,
  UpdateDonationConfigDto,
  CreateDonationDto,
  UpdateDonationDto,
  CreateRazorpayOrderDto,
  VerifyPaymentDto,
  DonationStatus,
} from './dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { AdminOnly, Public } from '@/common/decorators';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('donations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DonationController {
  constructor(private readonly donationService: DonationService) {}

  // ============================================
  // Public Endpoints (Donation Config)
  // ============================================

  @Public()
  @Get('config')
  async findAllConfigs(@Query('activeOnly') activeOnly?: string) {
    return this.donationService.findAllConfigs(activeOnly === 'true');
  }

  @Public()
  @Get('config/:id')
  async findConfigById(@Param('id') id: string) {
    return this.donationService.findConfigById(id);
  }

  // ============================================
  // Admin Config Endpoints
  // ============================================

  @Post('config')
  @AdminOnly()
  async createConfig(@Body() dto: CreateDonationConfigDto) {
    return this.donationService.createConfig(dto);
  }

  @Put('config/:id')
  @AdminOnly()
  async updateConfig(@Param('id') id: string, @Body() dto: UpdateDonationConfigDto) {
    return this.donationService.updateConfig(id, dto);
  }

  @Delete('config/:id')
  @AdminOnly()
  async deleteConfig(@Param('id') id: string) {
    await this.donationService.deleteConfig(id);
    return { message: 'Configuration deleted successfully' };
  }

  // ============================================
  // Public Donation Endpoints
  // ============================================

  @Public()
  @Post('create-order')
  async createRazorpayOrder(@Body() dto: CreateRazorpayOrderDto, @Request() req: any) {
    const userId = req.user?.sub;
    return this.donationService.createRazorpayOrder(dto, userId);
  }

  @Public()
  @Post('verify-payment')
  async verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.donationService.verifyPayment(dto);
  }

  @Public()
  @Post()
  async createDonation(@Body() dto: CreateDonationDto, @Request() req: any) {
    const userId = req.user?.sub;
    return this.donationService.createDonation(dto, userId);
  }

  // ============================================
  // User Donation Endpoints
  // ============================================

  @Get('my-donations')
  async findMyDonations(@CurrentUser() user: any) {
    return this.donationService.findDonationsByUser(user.sub);
  }

  // ============================================
  // Admin Donation Endpoints
  // ============================================

  @Get()
  @AdminOnly()
  async findAllDonations(@Query('status') status?: DonationStatus) {
    return this.donationService.findAllDonations(status);
  }

  @Get('stats')
  @AdminOnly()
  async getStats() {
    return this.donationService.getStats();
  }

  @Get(':id')
  @AdminOnly()
  async findDonationById(@Param('id') id: string) {
    return this.donationService.findDonationById(id);
  }

  @Put(':id')
  @AdminOnly()
  async updateDonation(@Param('id') id: string, @Body() dto: UpdateDonationDto) {
    return this.donationService.updateDonation(id, dto);
  }
}
