import { ConfigService } from '@nestjs/config';
export declare class LLMService {
    private readonly configService;
    private providers;
    private defaultProvider;
    private cache;
    constructor(configService: ConfigService);
    private initializeProviders;
}
