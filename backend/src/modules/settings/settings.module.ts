import { Module, Global } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';

/**
 * Global Settings Module — provides SettingsService to all modules.
 *
 * Marked as @Global() so PaymentService, OrdersService, etc.
 * can inject SettingsService without importing SettingsModule.
 */
@Global()
@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
