import { DynamicModule, Module, Global } from '@nestjs/common';
import { StorageService } from './StorageService';
import { GcsStorageService } from './GcsStorageService';
import { ConfigModule, ConfigService } from '@nestjs/config';

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
