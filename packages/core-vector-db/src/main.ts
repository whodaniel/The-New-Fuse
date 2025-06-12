import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { join } from 'path';
import { VectorDatabaseModule } from './vector-database.module';

async function bootstrap() {
  const logger = new Logger('VectorDBMicroservice');

  // Configuration from environment variables
  const grpcUrl = process.env.GRPC_URL || '0.0.0.0:50051';
  const protoPath = process.env.PROTO_PATH || join(__dirname, '../../../proto-definitions/proto/vector_store.proto');

  logger.log(`Starting Vector Database gRPC microservice on ${grpcUrl}`);
  logger.log(`Using proto file: ${protoPath}`);

  // Create the gRPC microservice
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    VectorDatabaseModule.forRoot({
      vectorDbConfig: {
        provider: (process.env.VECTOR_DB_TYPE as any) || 'qdrant',
        apiKey: process.env.VECTOR_DB_API_KEY || process.env.QDRANT_API_KEY,
        host: process.env.VECTOR_DB_HOST || process.env.VECTOR_DB_URL || process.env.QDRANT_URL || 'http://localhost:6333',
        port: process.env.VECTOR_DB_PORT ? parseInt(process.env.VECTOR_DB_PORT) : undefined,
        database: process.env.VECTOR_DB_DATABASE,
        ssl: process.env.VECTOR_DB_SSL === 'true',
        poolSize: process.env.VECTOR_DB_POOL_SIZE ? parseInt(process.env.VECTOR_DB_POOL_SIZE) : 10,
        timeout: process.env.VECTOR_DB_TIMEOUT ? parseInt(process.env.VECTOR_DB_TIMEOUT) : 30000,
      },
      embeddingConfig: {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
        dimension: process.env.OPENAI_EMBEDDING_DIMENSIONS ? parseInt(process.env.OPENAI_EMBEDDING_DIMENSIONS) : 1536,
      },
    }),
    {
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
    },
  );

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

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.log('SIGINT received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  // Start the microservice
  await app.listen();
  logger.log('Vector Database gRPC microservice is running');
}

bootstrap().catch((error) => {
  console.error('Failed to start microservice:', error);
  process.exit(1);
});