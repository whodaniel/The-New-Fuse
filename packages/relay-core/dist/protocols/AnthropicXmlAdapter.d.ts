/**
 * Anthropic XML Protocol Adapter
 *
 * Based on existing AnthropicXmlAdapter in packages/core/src/protocols/adapters/
 * Handles Anthropic's XML-based function calling and tool invocation format
 */
import { ProtocolAdapter } from './ProtocolAdapter.js';
import { RelayMessage, ProtocolType } from '../types/index.js';
import { Logger } from '../utils/Logger.js';
export declare class AnthropicXmlAdapter implements ProtocolAdapter {
    readonly name = "anthropic-xml";
    readonly version = "1.0.0";
    readonly supportedProtocols: ProtocolType[];
    private logger;
    constructor(logger: Logger);
    canTranslate(from: ProtocolType, to: ProtocolType): boolean;
    translate(message: RelayMessage, sourceProtocol: ProtocolType, targetProtocol: ProtocolType): Promise<RelayMessage>;
    private anthropicXmlToA2A;
    private a2aToAnthropicXml;
    private isAnthropicXmlFunctionCall;
    private isAnthropicXmlToolResponse;
    private extractFunctionName;
    private extractFunctionParameters;
    private extractReasoning;
    private extractToolResult;
    private extractToolSuccess;
    private extractToolMetadata;
    private extractTextContent;
    private extractThinking;
    private extractArtifacts;
    private createAnthropicXmlFunctionCall;
    private createAnthropicXmlToolResponse;
    private createAnthropicXmlContent;
}
//# sourceMappingURL=AnthropicXmlAdapter.d.ts.map