import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionContentUploadController } from './subscription-content-upload.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionContentService } from './subscription-content.service';
import { StorageModule } from '@/common/storage';

@Module({
  imports: [StorageModule],
  controllers: [SubscriptionsController, SubscriptionContentUploadController],
  providers: [SubscriptionsService, SubscriptionContentService],
  exports: [SubscriptionsService, SubscriptionContentService],
})
export class SubscriptionsModule {}
