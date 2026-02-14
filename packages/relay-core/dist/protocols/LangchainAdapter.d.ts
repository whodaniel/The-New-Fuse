/**
 * Langchain Protocol Adapter
 *
 * Handles Langchain's agent framework format
 * Converts between Langchain agent messages and The New Fuse's A2A protocol
 */
import { ProtocolAdapter } from './ProtocolAdapter.js';
import { RelayMessage, ProtocolType } from '../types/index.js';
import { Logger } from '../utils/Logger.js';
export declare class LangchainAdapter implements ProtocolAdapter {
    readonly name = "langchain";
    readonly version = "1.0.0";
    readonly supportedProtocols: ProtocolType[];
    private logger;
    constructor(logger: Logger);
    canTranslate(from: ProtocolType, to: ProtocolType): boolean;
    translate(message: RelayMessage, sourceProtocol: ProtocolType, targetProtocol: ProtocolType): Promise<RelayMessage>;
    private langchainToA2A;
    private a2aToLangchain;
    private isLangchainAgentAction;
    private isLangchainAgentFinish;
    private isLangchainToolExecution;
    private isLangchainMemory;
    private isLangchainChainExecution;
    private extractLangchainReasoning;
    private extractLangchainContent;
    private extractLangchainMetadata;
    private createLangchainAgentAction;
    private createLangchainAgentFinish;
    private createLangchainToolExecution;
    private createLangchainMemory;
    private createLangchainChainExecution;
    private createLangchainMessage;
}
//# sourceMappingURL=LangchainAdapter.d.ts.map