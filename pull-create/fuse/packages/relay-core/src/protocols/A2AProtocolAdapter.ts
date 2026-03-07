
/**
 * A2A Protocol Adapter for The New Fuse Relay System
 */

import { RelayMessage, ProtocolType } from '../types/index.js';
import { ProtocolAdapter } from './ProtocolAdapter.js';

export class A2AProtocolAdapter implements ProtocolAdapter {
  name = 'a2a';
  version = '2.0';
  supportedProtocols: ProtocolType[] = ['a2a-v2.0'];

  canTranslate(from: ProtocolType, to: ProtocolType): boolean {
    return from === 'a2a-v2.0' && this.supportedProtocols.includes(to);
  }

  async translate(message: RelayMessage, from: ProtocolType, to: ProtocolType): Promise<RelayMessage> {
    // Since this is the native protocol, no translation is needed.
    // In a real scenario, this would handle different versions of the A2A protocol.
    return message;
  }
}
