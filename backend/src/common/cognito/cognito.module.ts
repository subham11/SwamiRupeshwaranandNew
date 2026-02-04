import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { CognitoService } from './cognito.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'COGNITO_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new CognitoIdentityProviderClient({
          region: configService.get<string>('COGNITO_REGION', 'ap-south-1'),
        });
      },
      inject: [ConfigService],
    },
    CognitoService,
  ],
  exports: ['COGNITO_CLIENT', CognitoService],
})
export class CognitoModule {}
