import { ConfigService } from '@nestjs/config';
export declare class LlmController {
    private readonly configService;
    constructor(configService: ConfigService);
    proxyAlibaba(body: any, req: any): Promise<unknown>;
}
//# sourceMappingURL=llm.controller.d.ts.map