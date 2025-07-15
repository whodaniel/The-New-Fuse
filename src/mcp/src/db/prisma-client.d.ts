import { PrismaClient } from '@prisma/client';
export declare const prisma: PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import(".prisma/client/runtime/library").DefaultArgs>;
export declare const safeJsonParse: <T>(json: string, fallback: T) => T;
export declare const zodSchemaToJson: (schema: any) => string;
export declare const jsonToZodSchema: (json: string) => any;
export default prisma;
//# sourceMappingURL=prisma-client.d.ts.map