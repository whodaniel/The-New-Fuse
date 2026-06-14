"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = setupSwagger;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const fs = __importStar(require("fs"));
const yaml = __importStar(require("js-yaml"));
const path = __importStar(require("path"));
const logger = new common_1.Logger('SwaggerConfig');
// Constants for Swagger configuration
const SWAGGER_PATH = 'api-docs';
const API_TITLE = 'The New Fuse API';
const API_DESCRIPTION = 'Comprehensive API for multi-agent orchestration, workflow automation, and blockchain integration';
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
function setupSwagger(app) {
    if (process.env.ENABLE_API_DOCS !== 'false') {
        try {
            const openapiPath = path.join(__dirname, '../../..', 'openapi.yaml');
            let document;
            if (fs.existsSync(openapiPath)) {
                const fileContents = fs.readFileSync(openapiPath, 'utf8');
                document = yaml.load(fileContents); // Consider refining 'any'
                logger.log('Loaded OpenAPI specification from openapi.yaml');
            }
            else {
                const config = new swagger_1.DocumentBuilder()
                    .setTitle(API_TITLE)
                    .setDescription(API_DESCRIPTION)
                    .setVersion(API_VERSION)
                    .addBearerAuth({
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: BEARER_AUTH_DESCRIPTION,
                }, BEARER_AUTH_NAME)
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
                document = swagger_1.SwaggerModule.createDocument(app, config);
                logger.log('Generated OpenAPI specification from code decorators');
            }
            swagger_1.SwaggerModule.setup(SWAGGER_PATH, app, document, {
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
            logger.log(`API Documentation available at: ${DEV_API_SERVER_URL.replace('/api', '')}/${SWAGGER_PATH}`);
        }
        catch (error) {
            logger.error('Failed to setup API documentation', error);
        }
    }
}
//# sourceMappingURL=swagger.config.js.map