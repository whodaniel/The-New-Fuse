import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { VectorDatabaseModule } from './vector-database.module.js';

async function bootstrap() {
  const logger = new Logger('VectorDBMicroservice');
  const provider = (process.env.VECTOR_DB_TYPE || 'pgvector') as 'pgvector' | 'qdrant';

  // Configuration from environment variables
  const grpcUrl = process.env.GRPC_URL || '0.0.0.0:50051';
  const protoPath =
    process.env.PROTO_PATH || join(__dirname, '../../proto-definitions/proto/vector_store.proto');
  const httpPort = process.env.VECTOR_DB_HTTP_PORT ? parseInt(process.env.VECTOR_DB_HTTP_PORT) : 3005;

  logger.log(`Starting Vector Database service`);
  logger.log(`Using proto file: ${protoPath}`);

  // Create Hybrid Application (HTTP + gRPC)
  const app = await NestFactory.create(
    VectorDatabaseModule.forRoot({
      vectorDbConfig: {
        provider,
        apiKey: process.env.VECTOR_DB_API_KEY || process.env.QDRANT_API_KEY,
        connectionString: process.env.DATABASE_URL,
        host:
          provider === 'qdrant'
            ? process.env.VECTOR_DB_HOST ||
              process.env.VECTOR_DB_URL ||
              process.env.QDRANT_URL ||
              'http://localhost:6333'
            : process.env.VECTOR_DB_HOST || process.env.PGHOST || 'localhost',
        port: process.env.VECTOR_DB_PORT
          ? parseInt(process.env.VECTOR_DB_PORT)
          : process.env.PGPORT
            ? parseInt(process.env.PGPORT)
            : provider === 'qdrant'
              ? 6333
              : 5432,
        database: process.env.VECTOR_DB_DATABASE || process.env.PGDATABASE,
        ssl: process.env.VECTOR_DB_SSL === 'true',
        poolSize: process.env.VECTOR_DB_POOL_SIZE ? parseInt(process.env.VECTOR_DB_POOL_SIZE) : 10,
        timeout: process.env.VECTOR_DB_TIMEOUT ? parseInt(process.env.VECTOR_DB_TIMEOUT) : 30000,
      },
      embeddingConfig: {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
        dimension: process.env.OPENAI_EMBEDDING_DIMENSIONS
          ? parseInt(process.env.OPENAI_EMBEDDING_DIMENSIONS)
          : 1536,
      },
    })
  );

  // Connect gRPC microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'vectorstore.v1',
      protoPath,
      url: grpcUrl,
      maxReceiveMessageLength: 1024 * 1024 * 16, // 16MB
      maxSendMessageLength: 1024 * 1024 * 16, // 16MB
      keepalive: {
        keepaliveTimeMs: 120000,
        keepaliveTimeoutMs: 5000,
        keepalivePermitWithoutCalls: 1,
        http2MaxPingsWithoutData: 0,
        http2MinTimeBetweenPingsMs: 10000,
        http2MinPingIntervalWithoutDataMs: 5 * 60 * 1000,
      },
    },
  });

  // Enable shutdown hooks
  app.enableShutdownHooks();

  // Global error handling
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  // Start all microservices
  await app.startAllMicroservices();
  logger.log(`gRPC microservice running on ${grpcUrl}`);

  // Start HTTP server for health checks
  await app.listen(httpPort);
  logger.log(`HTTP server listening on port ${httpPort}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start microservice:', error);
  process.exit(1);
});
