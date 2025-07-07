import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class WebSocketService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private wss;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private handleMessage;
    broadcast(message: any): void;
}
//# sourceMappingURL=WebSocketService.d.ts.map