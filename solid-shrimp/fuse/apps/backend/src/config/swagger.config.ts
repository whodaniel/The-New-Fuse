import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication): any {
  const config = new DocumentBuilder()
    .setTitle('The New Fuse API')
    .setDescription(`
      The New Fuse is a cutting-edge AI Agent builder and task workflow builder SaaS platform.
      This API provides endpoints for managing agents, workflows, and real-time communication.
    `)
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('agents', 'Agent management endpoints')
    .addTag('chat', 'Real-time chat endpoints')
    .addTag('pipelines', 'Task pipeline endpoints')
    .addTag('health', 'Health check endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'API key for service-to-service communication'
      },
      'api-key'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
    operationIdFactory: (
      controllerKey: string,
      methodKey: string
    ) => methodKey
  });

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      syntaxHighlight: {
        theme: 'monokai'
      }
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 30px 0 }
      .swagger-ui .scheme-container { margin: 30px 0 }
      .swagger-ui .info .title { font-size: 32px }
      .swagger-ui .info .description { font-size: 16px }
    `,
    customSiteTitle: 'The New Fuse API Documentation'
  });
} 