import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards';
import { RolesGuard } from '@/common/guards/roles.guard';
import { SuperAdminOnly } from '@/common/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '@/common/decorators/current-user.decorator';
import { SettingsService } from './settings.service';
import {
  UpdateSettingDto,
  BulkUpdateSettingsDto,
  TestRazorpayConnectionDto,
  SettingCategory,
} from './dto';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@SuperAdminOnly()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ============================================
  // Get all settings
  // ============================================

  @Get()
  async getAllSettings() {
    const settings = await this.settingsService.getAll();
    return { settings };
  }

  // ============================================
  // Get settings by category
  // ============================================

  @Get('category/:category')
  async getByCategory(@Param('category') category: string) {
    const settings = await this.settingsService.getByCategory(category);
    return { settings };
  }

  // ============================================
  // Get Razorpay config (convenience endpoint)
  // ============================================

  @Get('razorpay')
  async getRazorpayConfig() {
    const settings = await this.settingsService.getByCategory(SettingCategory.RAZORPAY);
    return { settings };
  }

  // ============================================
  // Update a single setting
  // ============================================

  @Put()
  async updateSetting(
    @Body() dto: UpdateSettingDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    await this.settingsService.set(dto.key, dto.value, {
      category: dto.category as SettingCategory,
      description: dto.description,
      isSecret: dto.isSecret,
      updatedBy: user.email,
    });

    return { success: true, message: `Setting "${dto.key}" updated` };
  }

  // ============================================
  // Bulk update settings for a category
  // ============================================

  @Put('bulk')
  async bulkUpdateSettings(
    @Body() dto: BulkUpdateSettingsDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    await this.settingsService.bulkSet(
      dto.category as SettingCategory,
      dto.settings,
      user.email,
    );

    // Invalidate cache after bulk update
    this.settingsService.invalidateCache();

    return {
      success: true,
      message: `${dto.settings.length} settings updated in category "${dto.category}"`,
    };
  }

  // ============================================
  // Test Razorpay connection
  // ============================================

  @Post('razorpay/test')
  @HttpCode(HttpStatus.OK)
  async testRazorpayConnection(@Body() dto: TestRazorpayConnectionDto) {
    const result = await this.settingsService.testRazorpayConnection(
      dto.keyId,
      dto.keySecret,
    );
    return result;
  }

  // ============================================
  // Delete a setting (reverts to env var)
  // ============================================

  @Delete(':key')
  async deleteSetting(@Param('key') key: string) {
    await this.settingsService.delete(key);
    return { success: true, message: `Setting "${key}" deleted (reverted to env var)` };
  }

  // ============================================
  // Invalidate cache (force re-read from DB)
  // ============================================

  @Post('cache/invalidate')
  @HttpCode(HttpStatus.OK)
  async invalidateCache() {
    this.settingsService.invalidateCache();
    return { success: true, message: 'Settings cache invalidated' };
  }
}
