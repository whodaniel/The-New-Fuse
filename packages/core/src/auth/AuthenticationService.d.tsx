import { JwtService } from '@nestjs/jwt';
import { RateLimiterService } from '../services/RateLimiterService.js';
export declare class AuthenticationService {
    private jwtService;
    private rateLimiter;
    private readonly config;
    constructor(jwtService: JwtService, rateLimiter: RateLimiterService, config: AuthConfig);
    authenticate(): Promise<void>;
}
