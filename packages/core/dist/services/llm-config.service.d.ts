import { ConfigService } from '@nestjs/config';
export declare class LlmConfigService {
    private readonly configService;
    constructor(configService: ConfigService);
    get apiKey(): string;
    get model(): string;
    get apiEndpoint(): string;
}
//# sourceMappingURL=llm-config.service.d.ts.map