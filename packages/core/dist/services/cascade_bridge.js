var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CascadeBridge_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { createLogger, transports, format } from 'winston';
const logger = createLogger({
    level: 'info',
    format: format.combine(format.timestamp(), format.json()),
    transports: [new transports.Console()],
});
let CascadeBridge = CascadeBridge_1 = class CascadeBridge {
    constructor(configService, redisService) {
        this.configService = configService;
        this.redisService = redisService;
        this.nestLogger = new Logger(CascadeBridge_1.name);
    }
    async start() {
        await this.redisService.subscribe('cascade-in', (message) => {
            const messageStr = typeof message.message === 'string' ? message.message : JSON.stringify(message.message);
            this.handleCascadeMessage(messageStr);
        });
        logger.info('Subscribed to cascade-in channel');
    }
    handleCascadeMessage(message) {
        try {
            const parsedMessage = JSON.parse(message);
            logger.info('Received cascade message:', parsedMessage);
            // Process the message and publish to cascade-out
            this.redisService.publish('cascade-out', JSON.stringify({ processed: true, ...parsedMessage }));
        }
        catch (err) {
            logger.error('Error handling cascade message', err);
        }
    }
};
CascadeBridge = CascadeBridge_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService,
        UnifiedRedisService])
], CascadeBridge);
export { CascadeBridge };
//# sourceMappingURL=cascade_bridge.js.map