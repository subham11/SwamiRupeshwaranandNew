import { Module, forwardRef } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { SubscriptionsModule } from '@/modules/subscriptions/subscriptions.module';
import { EmailModule } from '@/common/email/email.module';
import { OrdersModule } from '@/modules/orders/orders.module';

@Module({
  imports: [SubscriptionsModule, EmailModule, forwardRef(() => OrdersModule)],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
