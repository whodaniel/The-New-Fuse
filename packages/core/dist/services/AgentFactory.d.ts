import { ConfigService } from '@nestjs/config';
export declare class AgentFactory {
    private readonly configService;
    constructor(configService: ConfigService);
    createAgent(config: any): any;
    private generateId;
}
//# sourceMappingURL=AgentFactory.d.ts.map