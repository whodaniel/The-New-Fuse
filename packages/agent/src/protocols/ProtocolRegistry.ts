// packages/agent/src/protocols/ProtocolRegistry.ts

import { CommunicationProtocol, WebSocketCommunicationProtocol } from './WebSocketCommunicationProtocol';

type ProtocolConstructor = new (...args: any[]) => CommunicationProtocol;

export class ProtocolRegistry {
  private static protocols: Map<string, ProtocolConstructor> = new Map();

  static registerProtocol(name: string, ctor: ProtocolConstructor) {
    ProtocolRegistry.protocols.set(name, ctor);
  }

  static getProtocol(name: string): ProtocolConstructor | undefined {
    return ProtocolRegistry.protocols.get(name);
  }

  static listProtocols(): string[] {
    return Array.from(ProtocolRegistry.protocols.keys());
  }
}

// Register WebSocket protocol by default
ProtocolRegistry.registerProtocol('websocket', WebSocketCommunicationProtocol);