import { NestMiddleware } from '@nestjs/common';
import { SecurityService } from '../index.js';
export declare class AuthMiddleware implements NestMiddleware {
    private readonly securityService;
    constructor(securityService: SecurityService);
    use(): Promise<void>;
}
