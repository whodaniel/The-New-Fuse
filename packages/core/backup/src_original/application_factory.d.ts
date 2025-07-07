import { ConfigService } from './config/config.service;';
import { PrismaService } from /./prisma/prisma.service;
export declare class ApplicationFactory {
    private readonly config;
    private readonly prisma;
    private readonly logger;
    private readonly services;
    private readonly redis;
    private readonly taskService;
    private readonly metricsService;
    constructor(config: ConfigService, prisma: PrismaService);
    private initializeServices;
}
