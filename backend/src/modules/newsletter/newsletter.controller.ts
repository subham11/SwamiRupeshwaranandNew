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
import { NewsletterService } from './newsletter.service';
import {
  SubscribeNewsletterDto,
  UpdateSubscriberDto,
  CreateCampaignDto,
  UpdateCampaignDto,
  SendCampaignDto,
  SubscriberStatus,
} from './dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { AdminOnly, EditorOnly, Public } from '@/common/decorators';

@Controller('newsletter')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  // ============================================
  // Public Endpoints
  // ============================================

  @Public()
  @Post('subscribe')
  async subscribe(@Body() dto: SubscribeNewsletterDto) {
    return this.newsletterService.subscribe(dto);
  }

  @Public()
  @Post('unsubscribe')
  async unsubscribe(@Body('email') email: string) {
    await this.newsletterService.unsubscribe(email);
    return { message: 'Successfully unsubscribed' };
  }

  // ============================================
  // Admin Subscriber Endpoints
  // ============================================

  @Get('subscribers')
  @EditorOnly()
  async findAllSubscribers(@Query('status') status?: SubscriberStatus) {
    return this.newsletterService.findAllSubscribers(status);
  }

  @Get('subscribers/:id')
  @EditorOnly()
  async findSubscriberById(@Param('id') id: string) {
    return this.newsletterService.findSubscriberById(id);
  }

  @Put('subscribers/:id')
  @AdminOnly()
  async updateSubscriber(@Param('id') id: string, @Body() dto: UpdateSubscriberDto) {
    return this.newsletterService.updateSubscriber(id, dto);
  }

  @Delete('subscribers/:id')
  @AdminOnly()
  async deleteSubscriber(@Param('id') id: string) {
    await this.newsletterService.deleteSubscriber(id);
    return { message: 'Subscriber deleted successfully' };
  }

  // ============================================
  // Campaign Endpoints
  // ============================================

  @Get('campaigns')
  @EditorOnly()
  async findAllCampaigns() {
    return this.newsletterService.findAllCampaigns();
  }

  @Get('campaigns/:id')
  @EditorOnly()
  async findCampaignById(@Param('id') id: string) {
    return this.newsletterService.findCampaignById(id);
  }

  @Post('campaigns')
  @EditorOnly()
  async createCampaign(@Body() dto: CreateCampaignDto, @Request() req: any) {
    return this.newsletterService.createCampaign(dto, req.user.sub);
  }

  @Put('campaigns/:id')
  @EditorOnly()
  async updateCampaign(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.newsletterService.updateCampaign(id, dto);
  }

  @Delete('campaigns/:id')
  @AdminOnly()
  async deleteCampaign(@Param('id') id: string) {
    await this.newsletterService.deleteCampaign(id);
    return { message: 'Campaign deleted successfully' };
  }

  @Post('campaigns/:id/send')
  @AdminOnly()
  async sendCampaign(@Param('id') id: string, @Body() dto: SendCampaignDto) {
    return this.newsletterService.sendCampaign(id, dto);
  }

  // ============================================
  // Stats Endpoint
  // ============================================

  @Get('stats')
  @EditorOnly()
  async getStats() {
    return this.newsletterService.getStats();
  }
}
