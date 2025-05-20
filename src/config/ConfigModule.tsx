import { Module, DynamicModule, Provider } from "@nestjs/common";
import { ConfigService } from './config.service.js';

export interface ConfigModuleOptions {
  isGlobal?: boolean;
  load?: Record<string, unknown>[];
}

@Module({})
export class ConfigModule {
  static forRoot(options: ConfigModuleOptions = {}): DynamicModule {
    return {
      module: ConfigModule,
      global: options.isGlobal,
      providers: [
        {
          provide: ConfigService,
          useValue: new ConfigService(options.load),
        },
      ],
      exports: [ConfigService],
    };
  }
}
