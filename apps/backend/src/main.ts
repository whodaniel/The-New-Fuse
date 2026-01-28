import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
// import { UnifiedMonitoringService } from '@the-new-fuse/core';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import helmet from 'helmet';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  // const monitoringService = app.get(UnifiedMonitoringService);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: configService.get('CORS_ORIGINS')?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Performance
  app.use(compression());

  // Validation - Global validation pipe with strict settings
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Automatically transform payloads to DTO instances
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      disableErrorMessages: configService.get('NODE_ENV') === 'production', // Hide detailed errors in production
      validationError: {
        target: false, // Don't expose the target object in errors
        value: false, // Don't expose the value in errors
      },
    })
  );

  // Global Prefix
  app.setGlobalPrefix('api', { exclude: ['health'] });

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('The New Fuse API')
    .setDescription('API documentation for The New Fuse platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Monitoring
  // await monitoringService.onModuleInit();

  const port = configService.get('PORT') || 3001;
  await app.listen(port);
  console.log(`🚀 Backend application is running on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start backend application:', error);
  process.exit(1);
});
