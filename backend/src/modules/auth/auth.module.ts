import { Module } from '@nestjs/common';
import { OtpAuthController } from './otp-auth.controller';
import { OtpAuthService } from './otp-auth.service';

@Module({
  controllers: [OtpAuthController],
  providers: [OtpAuthService],
  exports: [OtpAuthService],
})
export class AuthModule {}
