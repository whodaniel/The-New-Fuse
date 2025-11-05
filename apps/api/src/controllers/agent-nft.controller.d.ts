import { AgentNftService } from '../services/agent-nft.service';
export declare class AgentNftController {
    private readonly agentNftService;
    constructor(agentNftService: AgentNftService);
    mintAgentNFT(agentId: string, metadata: any): Promise<any>;
    getAgentNFT(agentId: string): Promise<any>;
    transferAgentNFT(tokenId: string, toAddress: string): Promise<any>;
}
//# sourceMappingURL=agent-nft.controller.d.ts.map