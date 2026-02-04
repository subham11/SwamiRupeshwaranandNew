import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpAuthController } from './otp-auth.controller';
import { OtpAuthService } from './otp-auth.service';

@Module({
  controllers: [AuthController, OtpAuthController],
  providers: [AuthService, OtpAuthService],
  exports: [AuthService, OtpAuthService],
})
export class AuthModule {}
