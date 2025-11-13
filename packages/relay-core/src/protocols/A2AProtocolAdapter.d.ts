/**
 * A2A Protocol Adapter for The New Fuse Relay System
 */
import { RelayMessage, ProtocolType } from '../types/index.js';
import { ProtocolAdapter } from './ProtocolAdapter.js';
export declare class A2AProtocolAdapter implements ProtocolAdapter {
    name: string;
    version: string;
    supportedProtocols: ProtocolType[];
    canTranslate(from: ProtocolType, to: ProtocolType): boolean;
    translate(message: RelayMessage, from: ProtocolType, to: ProtocolType): Promise<RelayMessage>;
}
//# sourceMappingURL=A2AProtocolAdapter.d.ts.map