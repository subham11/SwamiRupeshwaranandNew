import { Module } from '@nestjs/common';
import { PageComponentsController } from './page-components.controller';
import { PageComponentsService } from './page-components.service';

@Module({
  controllers: [PageComponentsController],
  providers: [PageComponentsService],
  exports: [PageComponentsService],
})
export class PageComponentsModule {}
