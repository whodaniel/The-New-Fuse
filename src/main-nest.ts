import { NestFactory } from '@nestjs/core';
import { VectorDatabaseModule } from './vector-database.module';

async function bootstrap() {
  const app = await NestFactory.create(VectorDatabaseModule);
  await app.listen(3000);
  console.log('Vector Database Service is running on port 3000');
}

bootstrap();
