import { NestMiddleware } from '@nestjs/common';
import { SecurityService } from '../SecurityService.js';
export declare class SecurityMiddleware implements NestMiddleware {
    private readonly securityService;
    private logger;
    constructor(securityService: SecurityService);
    use(): Promise<void>;
}
