/**
 * Application Bootstrap
 * Entry point for the NestJS application
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
async function bootstrap() {
    const logger = new Logger('Bootstrap');
    // Create NestJS application
    const app = await NestFactory.create(AppModule);
    // Get configuration from environment
    const port = parseInt(process.env.PORT || '3000', 10);
    // Set global prefix for all routes
    app.setGlobalPrefix('api/v1');
    // Enable CORS with explicit options
    app.enableCors({
        origin: ['http://localhost:5174', 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });
    // Set up global validation pipe
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
    }));
    // Apply global exception filter
    app.useGlobalFilters(new GlobalExceptionFilter());
    // Swagger documentation removed for build compatibility
    // Start the server
    await app.listen(port);
    logger.log(`Application is running on: http://localhost:${port}/api/v1);
}

bootstrap().catch(err => {`, new Logger('Bootstrap').error(`Failed to start application: ${err.message}` `, err.stack);
});
    ));
}
//# sourceMappingURL=main.js.map