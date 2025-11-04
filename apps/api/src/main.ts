import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SecurityValidationMiddleware } from './middleware/security-validation.middleware';
import { CsrfProtectionMiddleware } from './middleware/csrf-protection.middleware';
import { EnhancedSecurityMiddleware } from './middleware/enhanced-security.middleware';
import { EnhancedErrorHandlerMiddleware } from './middleware/enhanced-error-handler.middleware';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    // Enable CORS with strict configuration
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com']
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With', 
        'X-CSRF-Token', 
        'X-Request-ID',
        'X-Client-IP'
      ],
    },
  });

  // Global validation pipe with enhanced options
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    disableErrorMessages: process.env.NODE_ENV === 'production',
    validationError: {
      target: false,
      value: false,
    },
  }));

  // Apply security middleware in order (before error handling)
  app.use(app.get(SecurityValidationMiddleware));
  app.use(app.get(CsrfProtectionMiddleware));
  app.use(app.get(EnhancedSecurityMiddleware));
  
  // Global error handler (should be last)
  app.use(app.get(EnhancedErrorHandlerMiddleware));

  // Set global prefix for API routes
  app.setGlobalPrefix('api');

  // Enhanced security headers
  app.use((req, res, next) => {
    // Content Security Policy
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self'; " +
      "connect-src 'self' wss: https:; " +
      "frame-src 'none'; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self';"
    );

    // Additional security headers
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
    
    // Remove server information
    res.removeHeader('X-Powered-By');
    
    next();
  });

  await app.listen(3001);
  console.log('🚀 API Server running on port 3001 with enhanced security');
}
bootstrap();
