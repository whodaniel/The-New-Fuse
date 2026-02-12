import { DynamicModule } from '@nestjs/common';
import { A2AConfig } from './types';
export declare class A2ACoreModule {
  static forRoot(config?: Partial<A2AConfig>): DynamicModule;
  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<A2AConfig> | A2AConfig;
    inject?: any[];
  }): DynamicModule;
}
//# sourceMappingURL=a2a.module.d.ts.map
