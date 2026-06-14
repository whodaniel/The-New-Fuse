import { TnfAgentEnvelopeIdentity } from '../contracts/envelope.js';
interface RelayConnectionConfig {
    RELAY_URL: string;
}
type LogFunction = (level: string, category: string, message: string, data?: Record<string, any>) => void;
type ProcessMessageFunction = (msg: any, source: string) => void;
type GetOrchestratorIdentityFunction = () => TnfAgentEnvelopeIdentity;
type OnDisconnectFunction = () => void;
export declare class RelayConnectionManager {
    private config;
    private log;
    private processMessage;
    private getOrchestratorEnvelopeIdentity;
    private onDisconnect;
    private ws;
    private reconnectTimer;
    private sessionId;
    constructor(config: RelayConnectionConfig, log: LogFunction, processMessage: ProcessMessageFunction, getOrchestratorEnvelopeIdentity: GetOrchestratorIdentityFunction, onDisconnect: OnDisconnectFunction, sessionId: string);
    connectRelay(): Promise<void>;
    scheduleReconnect(): void;
    private registerAsOrchestrator;
    send(msg: any): void;
    private handleRelayMessageInternal;
    close(): void;
}
export {};
//# sourceMappingURL=relay-connection.service.d.ts.map