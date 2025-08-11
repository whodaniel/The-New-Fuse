import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
async function bootstrap() {
  // Implementation needed
}
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(8000);
  console.log('Fuse Core API is running on http://localhost:8000');
}

bootstrap();