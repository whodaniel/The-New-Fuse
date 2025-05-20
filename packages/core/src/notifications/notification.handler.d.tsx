import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
export declare class NotificationHandler implements OnModuleInit {
    private prisma;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
}
