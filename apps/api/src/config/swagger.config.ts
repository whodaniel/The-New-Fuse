import { INestApplication, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

const logger = new Logger('SwaggerConfig');

// Constants for Swagger configuration
const SWAGGER_PATH = 'api-docs';
const API_TITLE = 'The New Fuse API';
const API_DESCRIPTION =
  'Comprehensive API for multi-agent orchestration, workflow automation, and blockchain integration';
const API_VERSION = '1.0.0';
const BEARER_AUTH_NAME = 'BearerAuth';
const BEARER_AUTH_DESCRIPTION = 'Enter JWT token';
const DEV_API_SERVER_URL = 'http://localhost:3001/api';
const DEV_API_SERVER_DESCRIPTION = 'Development API Server';
const GATEWAY_DEV_API_SERVER_URL = 'http://localhost:4000/api/v1';
const GATEWAY_DEV_API_SERVER_DESCRIPTION = 'API Gateway (Development)';
const CUSTOM_SITE_TITLE = 'The New Fuse API Documentation';
const CUSTOM_FAVICON_URL = 'https://thenewfuse.com/favicon.ico';
const CUSTOM_CSS = '.swagger-ui .topbar { display: none }';

export function setupSwagger(app: INestApplication): void {
  if (process.env.ENABLE_API_DOCS !== 'false') {
    try {
      const openapiPath = path.join(__dirname, '../../..', 'openapi.yaml');

      let document;
      if (fs.existsSync(openapiPath)) {
        const fileContents = fs.readFileSync(openapiPath, 'utf8');
        document = yaml.load(fileContents) as any; // Consider refining 'any'
        logger.log('Loaded OpenAPI specification from openapi.yaml');
      } else {
        const config = new DocumentBuilder()
          .setTitle(API_TITLE)
          .setDescription(API_DESCRIPTION)
          .setVersion(API_VERSION)
          .addBearerAuth(
            {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: BEARER_AUTH_DESCRIPTION,
            },
            BEARER_AUTH_NAME
          )
          .addServer(DEV_API_SERVER_URL, DEV_API_SERVER_DESCRIPTION)
          .addServer(GATEWAY_DEV_API_SERVER_URL, GATEWAY_DEV_API_SERVER_DESCRIPTION)
          .addTag('auth', 'Authentication and authorization endpoints')
          .addTag('Agents', 'Agent management and orchestration')
          .addTag('chat', 'Chat rooms and messaging')
          .addTag('workflows', 'Workflow creation and execution')
          .addTag('wallets', 'Web3 wallet management')
          .addTag('transactions', 'Blockchain transaction operations')
          .addTag('smart-accounts', 'ERC-4337 Smart Account operations')
          .addTag('mcp', 'Model Context Protocol operations')
          .build();

        document = SwaggerModule.createDocument(app, config);
        logger.log('Generated OpenAPI specification from code decorators');
      }

      SwaggerModule.setup(SWAGGER_PATH, app, document, {
        swaggerOptions: {
          persistAuthorization: true,
          tagsSorter: 'alpha',
          operationsSorter: 'alpha',
          docExpansion: 'none',
          filter: true,
          tryItOutEnabled: true,
        },
        customSiteTitle: CUSTOM_SITE_TITLE,
        customfavIcon: CUSTOM_FAVICON_URL,
        customCss: CUSTOM_CSS,
      });

      logger.log(
        `API Documentation available at: ${DEV_API_SERVER_URL.replace('/api', '')}/${SWAGGER_PATH}`
      );
    } catch (error) {
      logger.error('Failed to setup API documentation', error);
    }
  }
}
