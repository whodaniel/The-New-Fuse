import { ProtocolType } from '../types/prisma-enums';
import { ProtocolMessage } from '../AgentProtocolBridge';
export interface ProtocolAdapter {
    name: string;
    version: string;
    supportedProtocols: ProtocolType[];
    canTranslate(source: ProtocolType, target: ProtocolType): boolean;
    translate(message: ProtocolMessage, targetProtocol: ProtocolType): Promise<ProtocolMessage>;
}
export declare class A2AToMCPAdapter implements ProtocolAdapter {
    name: string;
    version: string;
    supportedProtocols: ProtocolType[];
    private readonly logger;
    canTranslate(source: ProtocolType, target: ProtocolType): boolean;
    translate(message: ProtocolMessage, targetProtocol: ProtocolType): Promise<ProtocolMessage>;
    private a2aToMCP;
    private mcpToA2A;
    private mapA2APriorityToNumber;
    private extractPriorityFromMCPParams;
}
//# sourceMappingURL=A2AToMCPAdapter.d.ts.map