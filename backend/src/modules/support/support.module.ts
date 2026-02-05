import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { DatabaseModule } from '@/common/database/database.module';
import { EmailModule } from '@/common/email/email.module';

@Module({
  imports: [DatabaseModule.forRoot(), EmailModule],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
