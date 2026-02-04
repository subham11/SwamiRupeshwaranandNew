import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoDBService } from './dynamodb.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'DYNAMODB_CLIENT',
      useFactory: (configService: ConfigService) => {
        const isLocal = configService.get<string>('NODE_ENV') === 'development';
        const endpoint = configService.get<string>('DYNAMODB_ENDPOINT');

        const clientConfig: any = {
          region: configService.get<string>('AWS_REGION', 'ap-south-1'),
        };

        // Use local DynamoDB for development
        if (isLocal && endpoint) {
          clientConfig.endpoint = endpoint;
          clientConfig.credentials = {
            accessKeyId: 'local',
            secretAccessKey: 'local',
          };
        }

        const client = new DynamoDBClient(clientConfig);
        
        // Create DocumentClient with marshalling options
        return DynamoDBDocumentClient.from(client, {
          marshallOptions: {
            convertEmptyValues: false,
            removeUndefinedValues: true,
            convertClassInstanceToMap: true,
          },
          unmarshallOptions: {
            wrapNumbers: false,
          },
        });
      },
      inject: [ConfigService],
    },
    DynamoDBService,
  ],
  exports: ['DYNAMODB_CLIENT', DynamoDBService],
})
export class DynamoDBModule {}
