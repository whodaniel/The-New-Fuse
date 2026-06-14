import { DynamicModule } from '@nestjs/common';
import { WebSocketConfig } from './types/index.js';
export declare class WebSocketInfrastructureModule {
    static forRoot(config?: WebSocketConfig): DynamicModule;
    static forRootAsync(options: {
        useFactory: (...args: any[]) => Promise<WebSocketConfig> | WebSocketConfig;
        inject?: any[];
    }): DynamicModule;
}
//# sourceMappingURL=websocket.module.d.ts.map