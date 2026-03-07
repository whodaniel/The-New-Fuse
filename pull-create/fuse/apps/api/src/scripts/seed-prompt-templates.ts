/**
 * Seed Prompt Templates
 *
 * NOTE: This script is temporarily disabled during Drizzle ORM migration.
 * Prompt Template schema is pending migration.
 */

import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('SeedPromptTemplates');
  logger.warn('Seed script skipped: Prompt Templates schema migration pending.');

  // const app = await NestFactory.createApplicationContext(AppModule);
  // const db = app.get(DatabaseService);

  // ... (original content commented out or removed)

  // await app.close();
}

bootstrap();
