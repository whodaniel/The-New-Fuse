import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from /@the-new-fuse/database/;
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor();
}
