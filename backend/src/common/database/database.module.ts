import { Module, Global, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DATABASE_SERVICE } from './database.interface';
import { DynamoDBDatabaseService } from './dynamodb.database.service';
import { MongoDBDatabaseService } from './mongodb.database.service';

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: DATABASE_SERVICE,
          useFactory: async (configService: ConfigService) => {
            const nodeEnv = configService.get<string>('NODE_ENV', 'development');
            const useDynamoDb = configService.get<string>('USE_DYNAMODB', 'false') === 'true';
            const useMongoDb = configService.get<string>('USE_MONGODB', 'false') === 'true';
            
            // Explicit DynamoDB usage for AWS deployment
            // USE_DYNAMODB=true takes precedence, or when NODE_ENV is production/dev (AWS stages)
            const isAwsDeployment = useDynamoDb || nodeEnv === 'prod' || nodeEnv === 'production' || nodeEnv === 'dev';
            
            // Use MongoDB only for local development (NODE_ENV=development) or when explicitly set
            if (!isAwsDeployment && (nodeEnv === 'development' || useMongoDb)) {
              const mongoUri = configService.get<string>('MONGODB_URI');
              if (mongoUri) {
                console.log('🍃 Using MongoDB for database (local development)');
                const mongoService = new MongoDBDatabaseService(configService);
                await mongoService.connect();
                return mongoService;
              }
            }
            
            console.log('⚡ Using DynamoDB for database (AWS deployment)');
            return new DynamoDBDatabaseService(configService);
          },
          inject: [ConfigService],
        },
      ],
      exports: [DATABASE_SERVICE],
    };
  }
}
