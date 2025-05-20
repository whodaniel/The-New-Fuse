import { ConfigService } from '@nestjs/config';
export declare class OpenAIProvider {
    private configService;
    private openai;
    constructor(configService: ConfigService);
}
