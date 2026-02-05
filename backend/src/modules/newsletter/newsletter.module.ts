import { Module } from '@nestjs/common';
import { NewsletterController } from './newsletter.controller';
import { NewsletterService } from './newsletter.service';
import { DatabaseModule } from '@/common/database/database.module';
import { EmailModule } from '@/common/email/email.module';

@Module({
  imports: [DatabaseModule.forRoot(), EmailModule],
  controllers: [NewsletterController],
  providers: [NewsletterService],
  exports: [NewsletterService],
})
export class NewsletterModule {}
