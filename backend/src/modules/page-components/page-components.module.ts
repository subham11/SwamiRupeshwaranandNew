import { Module } from '@nestjs/common';
import { PageComponentsController } from './page-components.controller';
import { PageComponentsService } from './page-components.service';
import { PageComponentsSeedService } from './page-components-seed.service';

@Module({
  controllers: [PageComponentsController],
  providers: [PageComponentsService, PageComponentsSeedService],
  exports: [PageComponentsService],
})
export class PageComponentsModule {}
