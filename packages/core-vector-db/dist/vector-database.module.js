var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var VectorDatabaseModule_1;
import { Module } from '@nestjs/common';
import { VectorStoreGrpcController } from './grpc/vector-store-grpc.controller.js';
import { HealthController } from './health.controller.js';
import { VectorDatabaseService } from './vector-database.service.js';
let VectorDatabaseModule = VectorDatabaseModule_1 = class VectorDatabaseModule {
    static forRoot(options) {
        return {
            module: VectorDatabaseModule_1,
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
                    useFactory: (vectorDbConfig, embeddingConfig) => {
                        return new VectorDatabaseService(vectorDbConfig, embeddingConfig);
                    },
                    inject: ['VECTOR_DB_CONFIG', 'EMBEDDING_CONFIG'],
                },
            ],
            exports: [VectorDatabaseService],
            global: true,
        };
    }
    static forRootAsync(options) {
        return {
            module: VectorDatabaseModule_1,
            controllers: [VectorStoreGrpcController, HealthController],
            providers: [
                {
                    provide: 'VECTOR_DB_MODULE_OPTIONS',
                    useFactory: options.useFactory,
                    inject: options.inject || [],
                },
                {
                    provide: VectorDatabaseService,
                    useFactory: async (moduleOptions) => {
                        return new VectorDatabaseService(moduleOptions.vectorDbConfig, moduleOptions.embeddingConfig);
                    },
                    inject: ['VECTOR_DB_MODULE_OPTIONS'],
                },
            ],
            exports: [VectorDatabaseService],
            global: true,
        };
    }
};
VectorDatabaseModule = VectorDatabaseModule_1 = __decorate([
    Module({})
], VectorDatabaseModule);
export { VectorDatabaseModule };
//# sourceMappingURL=vector-database.module.js.map