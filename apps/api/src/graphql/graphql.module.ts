import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@the-new-fuse/database';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

// Entities
import { User } from '../entities/user.entity';
import { Agent } from '../entities/agent.entity';
import { Workflow } from '../entities/workflow.entity';
import { WorkflowStep } from '../entities/workflow-step.entity';

// Resolvers
import { UserResolver } from './resolvers/user.resolver';
import { AgentResolver } from './resolvers/agent.resolver';
import { WorkflowResolver } from './resolvers/workflow.resolver';

// Loaders
import { UserLoader } from './loaders/user.loader';
import { AgentLoader } from './loaders/agent.loader';
import { WorkflowLoader } from './loaders/workflow.loader';

// Guards
import { GqlAuthGuard } from './guards/gql-auth.guard';

// Security
import { SecurityLoggingService } from '../security/security-logging.service';

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        autoSchemaFile: configService.get('NODE_ENV') === 'production' 
          ? true 
          : join(process.cwd(), 'apps/api/src/graphql/schema.gql'),
        sortSchema: true,
        playground: configService.get('NODE_ENV') !== 'production',
        introspection: configService.get('NODE_ENV') !== 'production',
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
      }),
      inject: [ConfigService],
    }),
    // TypeORM repositories for GraphQL resolvers
    TypeOrmModule.forFeature([User, Agent, Workflow, WorkflowStep]),
    DatabaseModule,
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
  exports: [
    UserResolver,
    AgentResolver,
    WorkflowResolver,
  ],
})
export class GraphqlModule {}
