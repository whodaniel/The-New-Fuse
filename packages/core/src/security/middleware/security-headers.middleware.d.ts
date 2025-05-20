import { NestMiddleware } from '@nestjs/common';
export declare class SecurityHeadersMiddleware implements NestMiddleware {
    private readonly helmetMiddleware;
    constructor();
}
