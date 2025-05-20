import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
export declare class WebSocketService implements OnModuleInit, OnModuleDestroy {
    private wss;
    private readonly clients;
    ConfigService: any;
}
