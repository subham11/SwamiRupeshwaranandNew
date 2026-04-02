import { Module } from '@nestjs/common';
import { CartModule } from '@/modules/cart/cart.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { InvoiceService } from './invoice.service';

@Module({
  imports: [CartModule],
  controllers: [OrdersController],
  providers: [OrdersService, InvoiceService],
  exports: [OrdersService],
})
export class OrdersModule {}
