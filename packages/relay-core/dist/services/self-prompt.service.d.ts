import { type TnfAuditTrace } from '../contracts/audit.js';
import { type TnfAgentEnvelopeIdentity } from '../contracts/envelope.js';
import { RedisClientManager } from './redis-client-manager.service.js';
interface SelfPromptConfig {
    SELF_PROMPT_ENABLED: boolean;
    SELF_PROMPT_COOLDOWN_MS: number;
    REDIS_KEYS: {
        INGRESS: string;
        SELF_PROMPTS: string;
        EGRESS_PREFIX: string;
    };
}
type LogFunction = (level: string, category: string, message: string, data?: Record<string, any>) => void;
type GetOrchestratorIdentityFunction = () => TnfAgentEnvelopeIdentity;
type GetAgentIdentityFunction = (sourceOrAgentId: string) => TnfAgentEnvelopeIdentity;
type GetOrchestratorAuditFunction = (overrides?: Partial<TnfAuditTrace>) => Partial<TnfAuditTrace> & Pick<TnfAuditTrace, 'source' | 'actor'>;
export declare class SelfPromptService {
    private config;
    private log;
    private redisClient;
    private selfPromptCooldowns;
    private getOrchestratorEnvelopeIdentity;
    private getAgentEnvelopeIdentity;
    private getOrchestratorAudit;
    private sessionId;
    constructor(config: SelfPromptConfig, log: LogFunction, redisClient: RedisClientManager, getOrchestratorEnvelopeIdentity: GetOrchestratorIdentityFunction, getAgentEnvelopeIdentity: GetAgentIdentityFunction, getOrchestratorAudit: GetOrchestratorAuditFunction, sessionId: string);
    pruneCooldowns(now: number, maxAge: number): number;
    emitSelfPrompt(params: {
        kind: 'agent-stall' | 'process-stall';
        channel: string;
        prompt: string;
        reason: string;
        targetAgentId?: string;
        targetSourceId?: string;
        targetProcessId?: string;
        metadata?: Record<string, unknown>;
    }): Promise<void>;
}
export {};
//# sourceMappingURL=self-prompt.service.d.ts.map