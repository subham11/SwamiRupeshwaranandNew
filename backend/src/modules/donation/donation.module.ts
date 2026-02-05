import { Module } from '@nestjs/common';
import { DonationController } from './donation.controller';
import { DonationService } from './donation.service';
import { DatabaseModule } from '@/common/database/database.module';
import { EmailModule } from '@/common/email/email.module';

@Module({
  imports: [DatabaseModule.forRoot(), EmailModule],
  controllers: [DonationController],
  providers: [DonationService],
  exports: [DonationService],
})
export class DonationModule {}
