import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductReviewsService } from './product-reviews.service';
import { StorageModule } from '@/common/storage';

@Module({
  imports: [StorageModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductReviewsService],
  exports: [ProductsService, ProductReviewsService],
})
export class ProductsModule {}
