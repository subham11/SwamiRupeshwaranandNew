import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PageComponentsController } from './page-components.controller';
import { PageComponentsService } from './page-components.service';
import { PageComponentsSeedService } from './page-components-seed.service';

@Module({
  imports: [ConfigModule],
  controllers: [PageComponentsController],
  providers: [PageComponentsService, PageComponentsSeedService],
  exports: [PageComponentsService],
})
export class PageComponentsModule {}
