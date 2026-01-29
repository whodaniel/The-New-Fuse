
import { NestFactory } from '@nestjs/core';
import { SimpleAppModule } from '../src/simple-app.module';
import { SelfImprovementCronService } from '../src/modules/self-improvement/self-improvement-cron.service';
import { Logger } from '@nestjs/common';

async function main() {
  const logger = new Logger('JulesTrigger');
  logger.log('Initializing application context...');

  try {
    // Create application context (no HTTP server)
    const appContext = await NestFactory.createApplicationContext(SimpleAppModule);

    try {
      const service = appContext.get(SelfImprovementCronService);
      logger.log('Service initialized.');

      logger.log('Triggering pattern extraction...');
      await service.patternExtraction();
      logger.log('Pattern extraction complete.');

      logger.log('Manually creating demonstration Jules improvement task...');

      const demoPattern = {
        pattern: 'User Requested Loop Trigger',
        occurrences: 1,
        successRate: 1.0,
        examples: ['Manual trigger via script']
      };

      await service.triggerManualImprovement(demoPattern);
      logger.log('Demonstration task created successfully.');

    } catch (err: any) {
      logger.error('Error executing trigger:', err.message);
      if (err.message && err.message.includes('connect')) {
         console.log('Database connection failed. This is expected if the database is not running in this environment.');
      }
    } finally {
      await appContext.close();
    }

  } catch (error: any) {
    console.error('Error bootstrapping application:', error);
     if (error.message && error.message.includes('connect')) {
         console.log('Context creation failed due to DB connection. This is expected in sandbox.');
      }
  }
}

main().catch(console.error);
