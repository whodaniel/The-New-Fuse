import { DynamicModule } from "@nestjs/common";
export interface ConfigModuleOptions {
  isGlobal?: boolean;
  load?: Record<string, unknown>[];
}
export declare class ConfigModule {
  static forRoot(options?: ConfigModuleOptions): DynamicModule;
}
