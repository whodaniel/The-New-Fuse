import { ProtocolType } from '../types/prisma-enums';
import { ProtocolMessage } from '../AgentProtocolBridge';
import { ProtocolAdapter } from './A2AToMCPAdapter';
export declare class ClaudeToA2AAdapter implements ProtocolAdapter {
    name: string;
    version: string;
    supportedProtocols: ProtocolType[];
    private readonly logger;
    canTranslate(source: ProtocolType, target: ProtocolType): boolean;
    translate(message: ProtocolMessage, targetProtocol: ProtocolType): Promise<ProtocolMessage>;
    private claudeToA2A;
    private a2aToClaude;
    private determinePriorityFromTask;
}
//# sourceMappingURL=ClaudeToA2AAdapter.d.ts.map