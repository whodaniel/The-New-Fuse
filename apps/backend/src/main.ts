import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
// import { UnifiedMonitoringService } from '@the-new-fuse/core';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import helmet from 'helmet';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  // const monitoringService = app.get(UnifiedMonitoringService);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: configService.get('CORS_ORIGINS').split(','),
    credentials: true
  });

  // Performance
  app.use(compression());

  // Validation
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

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
  await monitoringService.onModuleInit();

  await app.listen(configService.get('PORT', 3001));
}
bootstrap();
