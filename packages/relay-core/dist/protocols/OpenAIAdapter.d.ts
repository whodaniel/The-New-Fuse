/**
 * OpenAI Protocol Adapter
 *
 * Handles OpenAI's Assistant API and function calling format
 * Converts between OpenAI format and The New Fuse's A2A protocol
 */
import { ProtocolAdapter } from './ProtocolAdapter.js';
import { RelayMessage, ProtocolType } from '../types/index.js';
import { Logger } from '../utils/Logger.js';
export declare class OpenAIAdapter implements ProtocolAdapter {
    readonly name = "openai-assistant";
    readonly version = "1.0.0";
    readonly supportedProtocols: ProtocolType[];
    private logger;
    constructor(logger: Logger);
    canTranslate(from: ProtocolType, to: ProtocolType): boolean;
    translate(message: RelayMessage, sourceProtocol: ProtocolType, targetProtocol: ProtocolType): Promise<RelayMessage>;
    private openaiToA2A;
    private a2aToOpenAI;
    private isOpenAIFunctionCall;
    private isOpenAIAssistantMessage;
    private isOpenAIToolOutput;
    private parseOpenAIFunctionParameters;
    private extractOpenAIContent;
    private extractOpenAIMetadata;
    private createOpenAIFunctionCall;
    private createOpenAIToolOutput;
    private createOpenAIAssistantMessage;
    private createOpenAIMessage;
}
//# sourceMappingURL=OpenAIAdapter.d.ts.map