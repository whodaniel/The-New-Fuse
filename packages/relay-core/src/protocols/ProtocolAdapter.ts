/**
 * Base Protocol Adapter for The New Fuse Relay System
 */

import { ProtocolType, RelayMessage } from '../types/index.js';

export interface ProtocolAdapter {
  name: string;
  version: string;
  supportedProtocols: ProtocolType[];

  canTranslate(from: ProtocolType, to: ProtocolType): boolean;
  translate(message: RelayMessage, from: ProtocolType, to: ProtocolType): Promise<RelayMessage>;
}
