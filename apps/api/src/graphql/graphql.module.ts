/**
 * GraphQL Module - Migrated to Drizzle ORM
 * Provides GraphQL API with Apollo Server using Drizzle for database access
 */
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtModule } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { join } from 'path';

// Resolvers
import { AgentResolver } from './resolvers/agent.resolver';
import { UserResolver } from './resolvers/user.resolver';
import { WorkflowResolver } from './resolvers/workflow.resolver';

// Loaders
import { AgentLoader } from './loaders/agent.loader';
import { UserLoader } from './loaders/user.loader';
import { WorkflowLoader } from './loaders/workflow.loader';

// Guards
import { GqlAuthGuard } from './guards/gql-auth.guard';

// Security
import { SecurityLoggingService } from '../security/security-logging.service';

@Module({
  imports: [
    ConfigModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isProduction =
          configService.get('NODE_ENV') === 'production' ||
          process.env.NODE_ENV === 'production' ||
          !!process.env.CLOUD_RUNTIME_ENVIRONMENT ||
          !!process.env.CLOUD_RUNTIME_PROJECT_ID;

        const baseDir = process.cwd();
        const schemaPath = baseDir.endsWith('apps/api')
          ? join(baseDir, 'src/graphql/schema.gql')
          : join(baseDir, 'apps/api/src/graphql/schema.gql');

        return {
          autoSchemaFile: isProduction ? true : schemaPath,
          sortSchema: true,
          playground: !isProduction,
          introspection: !isProduction,
          context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
          formatError: (error: any) => {
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
      inject: [ConfigService],
    }),
    // Drizzle database module - already global from AppModule
    // DatabaseModule removed to avoid DI conflicts
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    // Resolvers
    UserResolver,
    AgentResolver,
    WorkflowResolver,

    // Loaders
    UserLoader,
    AgentLoader,
    WorkflowLoader,

    // Guards
    GqlAuthGuard,

    // Security
    SecurityLoggingService,
  ],
  exports: [UserResolver, AgentResolver, WorkflowResolver],
})
export class GraphqlModule {}
