import { Module, DynamicModule } from '@nestjs/common';
import { VectorDatabaseService } from './vector-database.service';
import { VectorDatabaseConfig, EmbeddingConfig } from './interface/vector-database.interface';

export interface VectorDatabaseModuleOptions {
  vectorDbConfig: VectorDatabaseConfig;
  embeddingConfig: EmbeddingConfig;
}

@Module({})
export class VectorDatabaseModule {
  static forRoot(options: VectorDatabaseModuleOptions): DynamicModule {
    return {
      module: VectorDatabaseModule,
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
      ],
      exports: [VectorDatabaseService],
      global: true,
    };
  }

  static forRootAsync(options: {
    useFactory: (...args: any[]) => Promise<VectorDatabaseModuleOptions> | VectorDatabaseModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: VectorDatabaseModule,
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
      ],
      exports: [VectorDatabaseService],
      global: true,
    };
  }
}