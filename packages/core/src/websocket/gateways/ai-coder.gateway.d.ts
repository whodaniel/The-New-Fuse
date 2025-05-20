import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { RedisService } from '../../redis/redis.service.js';
import { SecurityConfig } from '../types/config.js';
import { MonitoringService } from '../../monitoring/monitoring.service.js';
export declare class AICoderGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly redisService;
    private readonly securityConfig;
    private readonly monitoringService;
    : Server;
    private logger;
    constructor(redisService: RedisService, securityConfig: SecurityConfig, monitoringService: MonitoringService);
    private setupRedisListeners;
}
