import { DynamicModule, Module } from '@nestjs/common';
import { OpenAIEmbeddingProvider } from './drivers/openai-embedding.provider';
import { PgVectorDriver } from './drivers/pgvector.driver';
import { QdrantDriver } from './drivers/qdrant.driver';
import { VectorStoreGrpcController } from './grpc/vector-store-grpc.controller';
import { HealthController } from './health.controller';
import { EmbeddingConfig, VectorDatabaseConfig } from './interface/vector-database.interface';
import { VectorDatabaseService } from './vector-database.service';

export interface VectorDatabaseModuleOptions {
  vectorDbConfig: VectorDatabaseConfig;
  embeddingConfig: EmbeddingConfig;
}

@Module({})
export class VectorDatabaseModule {
  static forRoot(options: VectorDatabaseModuleOptions): DynamicModule {
    return {
      module: VectorDatabaseModule,
      controllers: [VectorStoreGrpcController, HealthController],
      providers: [
        {
          provide: 'VECTOR_DB_CONFIG',
          useValue: options.vectorDbConfig,
        },
        {
          provide: 'EMBEDDING_CONFIG',
          useValue: options.embeddingConfig,
        },
        {
          provide: VectorDatabaseService,
          useFactory: (vectorDbConfig: VectorDatabaseConfig, embeddingConfig: EmbeddingConfig) => {
            return new VectorDatabaseService(vectorDbConfig, embeddingConfig);
          },
          inject: ['VECTOR_DB_CONFIG', 'EMBEDDING_CONFIG'],
        },
        PgVectorDriver,
        QdrantDriver,
        OpenAIEmbeddingProvider,
      ],
      exports: [VectorDatabaseService, PgVectorDriver, QdrantDriver, OpenAIEmbeddingProvider],
      global: true,
    };
  }

  static forRootAsync(options: {
    useFactory: (
      ...args: any[]
    ) => Promise<VectorDatabaseModuleOptions> | VectorDatabaseModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: VectorDatabaseModule,
      controllers: [VectorStoreGrpcController, HealthController],
      providers: [
        {
          provide: 'VECTOR_DB_MODULE_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: VectorDatabaseService,
          useFactory: async (moduleOptions: VectorDatabaseModuleOptions) => {
            return new VectorDatabaseService(
              moduleOptions.vectorDbConfig,
              moduleOptions.embeddingConfig
            );
          },
          inject: ['VECTOR_DB_MODULE_OPTIONS'],
        },
        PgVectorDriver,
        QdrantDriver,
        OpenAIEmbeddingProvider,
      ],
      exports: [VectorDatabaseService, PgVectorDriver, QdrantDriver, OpenAIEmbeddingProvider],
      global: true,
    };
  }
}
