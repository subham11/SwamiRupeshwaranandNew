import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // CORS Configuration
  const corsOrigins = configService.get<string>('CORS_ORIGINS', '*');
  app.enableCors({
    origin: corsOrigins === '*' ? '*' : corsOrigins.split(','),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Documentation
  const swaggerEnabled = configService.get<string>('SWAGGER_ENABLED', 'true') === 'true';
  if (swaggerEnabled) {
    const stage = configService.get<string>('STAGE', 'dev');
    const apiGatewayUrl = configService.get<string>('API_GATEWAY_URL', '');

    const configBuilder = new DocumentBuilder()
      .setTitle(configService.get<string>('SWAGGER_TITLE', 'Swami Rupeshwaranand API'))
      .setDescription(configService.get<string>('SWAGGER_DESCRIPTION', 'Backend API'))
      .setVersion(configService.get<string>('SWAGGER_VERSION', '1.0'));

    // Add server URLs
    if (apiGatewayUrl) {
      configBuilder.addServer(
        `${apiGatewayUrl}/${stage}`,
        `AWS ${stage.toUpperCase()} Environment`,
      );
    }
    configBuilder.addServer(
      `http://localhost:${configService.get<number>('API_PORT', 2026)}`,
      'Local Development',
    );

    const config = configBuilder
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Health', 'Health check endpoints')
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Users', 'User management endpoints')
      .addTag('Content', 'Content management endpoints')
      .addTag('Events', 'Events management endpoints')
      .addTag('Teachings', 'Teachings management endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const port = configService.get<number>('API_PORT', 2026);
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/docs`);
}

bootstrap();
