/**
 * Unified Bridge for The New Fuse Framework
 *
 * Consolidates bridge patterns from:
 * - message-bridge.js (file-based agent coordination)
 * - terminal_bridge.js (AI agent terminal sharing)
 * - agent-bridge.service.js (WebSocket gateway)
 * - vscode-lm-bridge (VSCode language model integration)
 */
import { EventEmitter } from 'events';
import { RelayMessage, Transport } from '../types/index.js';
import { Logger } from '../utils/Logger.js';
export declare class UnifiedBridge extends EventEmitter {
    private logger;
    private transports;
    constructor(logger: Logger);
    addTransport(transport: Transport): void;
    private handleMessage;
    broadcast(message: RelayMessage): Promise<void>;
    send(message: RelayMessage): Promise<boolean>;
}
//# sourceMappingURL=UnifiedBridge.d.ts.map