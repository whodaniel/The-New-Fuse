import { OnModuleInit } from '@nestjs/common';
export declare class WebSocketService implements OnModuleInit {
    private readonly logger;
    private io;
    constructor();
    onModuleInit(): void;
}
