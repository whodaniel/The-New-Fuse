import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Add validation pipe
  app.useGlobalPipes(new ValidationPipe());

  // Enable CORS
  app.enableCors();

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`Backend API server started on port ${port}`);
}
bootstrap();
