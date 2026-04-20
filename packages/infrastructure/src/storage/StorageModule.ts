import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GcsStorageService } from './GcsStorageService.js';
import { StorageService } from './StorageService.js';

@Global()
@Module({})
export class StorageModule {
  static forRoot(): DynamicModule {
    return {
      module: StorageModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: StorageService,
          useClass: GcsStorageService, // Default to GCS for now as per user request
        },
      ],
      exports: [StorageService],
    };
  }
}
