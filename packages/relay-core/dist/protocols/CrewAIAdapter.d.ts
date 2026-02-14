/**
 * CrewAI Protocol Adapter
 *
 * Handles CrewAI's multi-agent framework format
 * Converts between CrewAI crew/agent messages and The New Fuse's A2A protocol
 */
import { ProtocolAdapter } from './ProtocolAdapter.js';
import { RelayMessage, ProtocolType } from '../types/index.js';
import { Logger } from '../utils/Logger.js';
export declare class CrewAIAdapter implements ProtocolAdapter {
    readonly name = "crewai";
    readonly version = "1.0.0";
    readonly supportedProtocols: ProtocolType[];
    private logger;
    constructor(logger: Logger);
    canTranslate(from: ProtocolType, to: ProtocolType): boolean;
    translate(message: RelayMessage, sourceProtocol: ProtocolType, targetProtocol: ProtocolType): Promise<RelayMessage>;
    private crewaiToA2A;
    private a2aToCrewAI;
    private isCrewAITaskExecution;
    private isCrewAICrewCoordination;
    private isCrewAIAgentCollaboration;
    private isCrewAIToolUsage;
    private isCrewAIMemorySharing;
    private extractCrewAIContent;
    private extractCrewAIMetadata;
    private createCrewAITaskExecution;
    private createCrewAICrewCoordination;
    private createCrewAIAgentCollaboration;
    private createCrewAIToolUsage;
    private createCrewAIMemorySharing;
    private createCrewAIMessage;
}
//# sourceMappingURL=CrewAIAdapter.d.ts.map