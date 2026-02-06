import { Module } from '@nestjs/common';
import { OtpAuthController } from './otp-auth.controller';
import { OtpAuthService } from './otp-auth.service';
import { CognitoModule } from '../../common/cognito/cognito.module';

@Module({
  imports: [CognitoModule],
  controllers: [OtpAuthController],
  providers: [OtpAuthService],
  exports: [OtpAuthService],
})
export class AuthModule {}
