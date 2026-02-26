import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionContentUploadController } from './subscription-content-upload.controller';
import { MonthlyScheduleController } from './monthly-schedule.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionContentService } from './subscription-content.service';
import { MonthlyScheduleService } from './monthly-schedule.service';
import { StorageModule } from '@/common/storage';

@Module({
  imports: [StorageModule],
  controllers: [SubscriptionsController, SubscriptionContentUploadController, MonthlyScheduleController],
  providers: [SubscriptionsService, SubscriptionContentService, MonthlyScheduleService],
  exports: [SubscriptionsService, SubscriptionContentService, MonthlyScheduleService],
})
export class SubscriptionsModule {}
