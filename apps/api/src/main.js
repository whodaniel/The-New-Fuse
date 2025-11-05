import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import helmet from 'helmet';
async function bootstrap() {
    try {
        console.log('🔧 Starting Backend API bootstrap...');
        console.log('📋 Environment variables:');
        console.log(`   PORT: ${process.env.PORT || '3001 (default)'}`);
        console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
        console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '[SET]' : 'undefined'}`);
        console.log(`   REDIS_URL: ${process.env.REDIS_URL ? '[SET]' : 'undefined'}`);
        console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '[SET]' : 'undefined'}`);
        const app = await NestFactory.create(AppModule);
        const configService = app.get(ConfigService);
        // Security middleware
        app.use(helmet());
        // CORS configuration
        app.enableCors({
            origin: configService.get('CORS_ORIGINS')?.split(',') || ['http://localhost:3000'],
            credentials: true
        });
        // Performance middleware
        app.use(compression());
        // Global API prefix
        app.setGlobalPrefix('api');
        // Global validation pipe
        app.useGlobalPipes(new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
        }));
        // Swagger documentation
        const config = new DocumentBuilder()
            .setTitle('The New Fuse - Consolidated API')
            .setDescription('Consolidated API documentation for The New Fuse platform - Phase 1 Framework Consolidation')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api/docs', app, document);
        const port = configService.get('PORT', 3001);
        await app.listen(port);
        console.log(`🚀 Consolidated API server running on port ${port}`);
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Avoid circular dependencies by handling bootstrap differently
if (require.main === module) {
    bootstrap();
}
//# sourceMappingURL=main.js.map