import { PrismaClient } from '@the-new-fuse/database/client';
declare global {
    var prisma: PrismaClient | undefined;
}
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@the-new-fuse/database/client/runtime/library").DefaultArgs>;
