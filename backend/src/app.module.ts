import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AdminModule } from './modules/admin/admin.module';
import { ContentModule } from './modules/content/content.module';
import { EventsModule } from './modules/events/events.module';
import { TeachingsModule } from './modules/teachings/teachings.module';
import { DatabaseModule } from './common/database/database.module';
import { CognitoModule } from './common/cognito/cognito.module';
import { EmailModule } from './common/email/email.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    // Common modules - DatabaseModule auto-switches between MongoDB (local) and DynamoDB (prod)
    DatabaseModule.forRoot(),
    CognitoModule,
    EmailModule,
    // Feature modules
    HealthModule,
    AuthModule,
    UsersModule,
    AdminModule,
    ContentModule,
    EventsModule,
    TeachingsModule,
  ],
})
export class AppModule {}
