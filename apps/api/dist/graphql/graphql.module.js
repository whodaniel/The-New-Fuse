"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphqlModule = void 0;
/**
 * GraphQL Module - Migrated to Drizzle ORM
 * Provides GraphQL API with Apollo Server using Drizzle for database access
 */
const apollo_1 = require("@nestjs/apollo");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const graphql_1 = require("@nestjs/graphql");
const jwt_1 = require("@nestjs/jwt");
const path_1 = require("path");
// Resolvers
const agent_resolver_1 = require("./resolvers/agent.resolver");
const user_resolver_1 = require("./resolvers/user.resolver");
const workflow_resolver_1 = require("./resolvers/workflow.resolver");
// Loaders
const agent_loader_1 = require("./loaders/agent.loader");
const user_loader_1 = require("./loaders/user.loader");
const workflow_loader_1 = require("./loaders/workflow.loader");
// Guards
const gql_auth_guard_1 = require("./guards/gql-auth.guard");
// Security
const security_logging_service_1 = require("../security/security-logging.service");
let GraphqlModule = class GraphqlModule {
};
exports.GraphqlModule = GraphqlModule;
exports.GraphqlModule = GraphqlModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            graphql_1.GraphQLModule.forRootAsync({
                driver: apollo_1.ApolloDriver,
                imports: [config_1.ConfigModule],
                useFactory: (configService) => {
                    const isProduction = configService.get('NODE_ENV') === 'production' ||
                        process.env.NODE_ENV === 'production' ||
                        !!process.env.CLOUD_RUNTIME_ENVIRONMENT ||
                        !!process.env.CLOUD_RUNTIME_PROJECT_ID;
                    const baseDir = process.cwd();
                    const schemaPath = baseDir.endsWith('apps/api')
                        ? (0, path_1.join)(baseDir, 'src/graphql/schema.gql')
                        : (0, path_1.join)(baseDir, 'apps/api/src/graphql/schema.gql');
                    return {
                        autoSchemaFile: isProduction ? true : schemaPath,
                        sortSchema: true,
                        playground: !isProduction,
                        introspection: !isProduction,
                        context: ({ req, res }) => ({ req, res }),
                        formatError: (error) => {
                            // Log GraphQL errors
                            console.error('GraphQL Error:', error);
                            // In production, don't expose internal errors
                            if (process.env.NODE_ENV === 'production') {
                                return {
                                    message: error.message,
                                    extensions: {
                                        code: error.extensions?.code,
                                    },
                                };
                            }
                            return error;
                        },
                        cors: {
                            origin: configService.get('CORS_ORIGIN') || 'http://localhost:3000',
                            credentials: true,
                        },
                    };
                },
                inject: [config_1.ConfigService],
            }),
            // Drizzle database module - already global from AppModule
            // DatabaseModule removed to avoid DI conflicts
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: (config) => ({
                    secret: config.get('JWT_SECRET'),
                    signOptions: { expiresIn: '15m' },
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        providers: [
            // Resolvers
            user_resolver_1.UserResolver,
            agent_resolver_1.AgentResolver,
            workflow_resolver_1.WorkflowResolver,
            // Loaders
            user_loader_1.UserLoader,
            agent_loader_1.AgentLoader,
            workflow_loader_1.WorkflowLoader,
            // Guards
            gql_auth_guard_1.GqlAuthGuard,
            // Security
            security_logging_service_1.SecurityLoggingService,
        ],
        exports: [user_resolver_1.UserResolver, agent_resolver_1.AgentResolver, workflow_resolver_1.WorkflowResolver],
    })
], GraphqlModule);
//# sourceMappingURL=graphql.module.js.map