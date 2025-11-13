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
}
//# sourceMappingURL=OpenAIAdapter.d.ts.map