import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@the-new-fuse/database';
export declare class UnifiedMonitoringService implements OnModuleInit {
    private readonly configService;
    private readonly prisma;
    private prometheusExporter;
    constructor(configService: ConfigService, prisma: PrismaService);
    private initializeSentry;
    private initializePrometheus;
    onModuleInit(): Promise<void>;
}
