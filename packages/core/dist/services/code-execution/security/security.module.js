var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CodeScanner } from './code-scanner.js';
import { RateLimiter } from './rate-limiter.js';
let SecurityModule = class SecurityModule {
};
SecurityModule = __decorate([
    Module({
        imports: [ConfigModule],
        providers: [
            CodeScanner,
            {
                provide: RateLimiter,
                useFactory: (configService) => {
                    const maxRequests = configService.get('CODE_EXECUTION_RATE_LIMIT_MAX_REQUESTS', 10);
                    const windowMs = configService.get('CODE_EXECUTION_RATE_LIMIT_WINDOW_MS', 60000);
                    return new RateLimiter(maxRequests, windowMs);
                },
                inject: [ConfigService],
            },
        ],
        exports: [CodeScanner, RateLimiter],
    })
], SecurityModule);
export { SecurityModule };
//# sourceMappingURL=security.module.js.map