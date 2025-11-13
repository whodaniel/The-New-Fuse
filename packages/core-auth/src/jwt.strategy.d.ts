import { PrismaService } from '@the-new-fuse/database';
export interface JwtPayload {
    sub: string;
    email: string;
    iat?: number;
    exp?: number;
}
export declare class JwtStrategy {
    private readonly prisma;
    constructor(prisma: PrismaService);
    validate(payload: JwtPayload): Promise<any>;
}
//# sourceMappingURL=jwt.strategy.d.ts.map