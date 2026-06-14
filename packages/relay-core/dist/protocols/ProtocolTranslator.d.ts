/**
 * Protocol Translator for The New Fuse Relay System
 */
import { EventEmitter } from 'events';
import { ProtocolAdapter, ProtocolType, RelayMessage } from '../types/index.js';
import { Logger } from '../utils/Logger.js';
export declare class ProtocolTranslator extends EventEmitter {
    private logger;
    private adapters;
    constructor(logger: Logger);
    registerAdapter(adapter: ProtocolAdapter): void;
    translate(message: RelayMessage, targetProtocol: ProtocolType): Promise<RelayMessage>;
    private findAdapter;
}
//# sourceMappingURL=ProtocolTranslator.d.ts.map