import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { LoggingService } from '../services/logging.service';
export declare class WsAuthGuard implements CanActivate {
    private jwtService;
    private logger;
    constructor(jwtService: JwtService, logger: LoggingService);
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean>;
    private extractTokenFromHeader;
}
//# sourceMappingURL=ws-auth.guard.d.ts.map