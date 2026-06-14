/**
 * Goose Protocol Adapter
 *
 * Bridges Goose CLI/headless interaction envelopes to TNF A2A relay messages.
 */
import { ProtocolType, RelayMessage } from '../types/index.js';
import { Logger } from '../utils/Logger.js';
import { ProtocolAdapter } from './ProtocolAdapter.js';
export declare class GooseAdapter implements ProtocolAdapter {
    readonly name = "goose-cli";
    readonly version = "1.0.0";
    readonly supportedProtocols: ProtocolType[];
    private logger;
    constructor(logger: Logger);
    canTranslate(from: ProtocolType, to: ProtocolType): boolean;
    translate(message: RelayMessage, sourceProtocol: ProtocolType, targetProtocol: ProtocolType): Promise<RelayMessage>;
    private gooseToA2A;
    private a2aToGoose;
    private withMetadata;
}
//# sourceMappingURL=GooseAdapter.d.ts.map