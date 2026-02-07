import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { SubscriptionsModule } from '@/modules/subscriptions/subscriptions.module';
import { EmailModule } from '@/common/email/email.module';

@Module({
  imports: [SubscriptionsModule, EmailModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
