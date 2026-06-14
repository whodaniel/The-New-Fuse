import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '@the-new-fuse/database';
export declare class AuthGuard implements CanActivate {
    private jwtService;
    private configService;
    private db;
    constructor(jwtService: JwtService, configService: ConfigService, db: DatabaseService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractTokenFromHeader;
}
//# sourceMappingURL=auth.guard.d.ts.map