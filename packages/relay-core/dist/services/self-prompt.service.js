"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelfPromptService = void 0;
const crypto_1 = require("crypto");
const tnf_envelope_js_1 = require("../protocol/tnf-envelope.js");
class SelfPromptService {
    constructor(config, log, redisClient, getOrchestratorEnvelopeIdentity, getAgentEnvelopeIdentity, getOrchestratorAudit, sessionId) {
        this.config = config;
        this.log = log;
        this.redisClient = redisClient;
        this.selfPromptCooldowns = new Map();
        this.getOrchestratorEnvelopeIdentity = getOrchestratorEnvelopeIdentity;
        this.getAgentEnvelopeIdentity = getAgentEnvelopeIdentity;
        this.getOrchestratorAudit = getOrchestratorAudit;
        this.sessionId = sessionId;
    }
    pruneCooldowns(now, maxAge) {
        let prunedCount = 0;
        for (const [key, timestamp] of this.selfPromptCooldowns.entries()) {
            if (now - timestamp > maxAge) {
                this.selfPromptCooldowns.delete(key);
                prunedCount++;
            }
        }
        if (prunedCount > 0) {
            this.log('debug', 'MEMORY', `Pruned ${prunedCount} self-prompt cooldowns`);
        }
        return prunedCount;
    }
    async emitSelfPrompt(params) {
        if (!this.config.SELF_PROMPT_ENABLED ||
            (!this.redisClient.rawRedisClient && !this.redisClient.rawUpstashClient)) {
            return;
        }
        const cooldownKey = `${params.kind}:${params.targetAgentId || params.targetProcessId || params.channel}`;
        const now = Date.now();
        const lastSentAt = this.selfPromptCooldowns.get(cooldownKey) || 0;
        if (now - lastSentAt < this.config.SELF_PROMPT_COOLDOWN_MS) {
            return;
        }
        this.selfPromptCooldowns.set(cooldownKey, now);
        const issuedAtIso = new Date(now).toISOString();
        const tenantId = process.env.TENANT_ID || 'tnf-local';
        const cumulativeId = {
            spec: 'tnf/mcid/0.1',
            id: (0, crypto_1.randomUUID)(),
            scope: {
                tenant_id: tenantId,
                session_key: this.sessionId,
                workflow_id: null,
                channel_id: params.channel,
            },
            lineage: {
                trace_id: null,
                correlation_id: (0, crypto_1.randomUUID)(),
                causation_id: null,
                handoff_packet_id: null,
                twid: null,
                task_id: null,
            },
            federation: {
                domain: tenantId,
                route: ['master-clock', 'self-prompt'],
                hop_count: 1,
                gate_decisions: [
                    { gate: 'TENANT_SCOPE_GATE', decision: 'allow', at: issuedAtIso },
                    { gate: 'TRACE_CONTINUITY_GATE', decision: 'allow', at: issuedAtIso },
                    { gate: 'CHANNEL_MEMBERSHIP_GATE', decision: 'allow', at: issuedAtIso },
                ],
            },
            issued_at: issuedAtIso,
        };
        const originalMessage = {
            type: 'CHANNEL_MESSAGE',
            channel: params.channel,
            payload: {
                from: this.sessionId,
                to: 'broadcast',
                content: params.prompt,
                metadata: {
                    isSystemMessage: true,
                    isSelfPrompt: true,
                    reason: params.reason,
                    ...(params.metadata || {}),
                },
            },
        };
        const broadcastEnvelope = (0, tnf_envelope_js_1.createTNFEnvelope)('event', this.getOrchestratorEnvelopeIdentity(), { broadcast: true }, {
            eventType: 'SELF_PROMPT',
            data: {
                ...params,
                cumulativeId,
                issuedAt: now,
            },
            originalMessage,
        }, {
            channelId: params.channel,
            sessionId: this.sessionId,
        }, {
            audit: this.getOrchestratorAudit({
                channelId: params.channel,
                sessionId: this.sessionId,
            }),
        });
        try {
            await this.redisClient.publish(this.config.REDIS_KEYS.INGRESS, JSON.stringify(broadcastEnvelope));
            await this.redisClient.lpush(this.config.REDIS_KEYS.SELF_PROMPTS, JSON.stringify({
                sessionId: this.sessionId,
                ...params,
                cumulativeId,
                issuedAt: now,
            }));
            await this.redisClient.ltrim(this.config.REDIS_KEYS.SELF_PROMPTS, 0, 499);
        }
        catch (error) {
            this.log('warn', 'SELF-PROMPT', `Failed to publish self-prompt: ${error.message}`);
        }
        if (params.targetSourceId) {
            const directEnvelope = (0, tnf_envelope_js_1.createTNFEnvelope)('task', this.getOrchestratorEnvelopeIdentity(), this.getAgentEnvelopeIdentity(params.targetSourceId), {
                action: 'self_prompt_continue',
                parameters: {
                    prompt: params.prompt,
                    reason: params.reason,
                    channel: params.channel,
                    cumulativeId,
                    ...(params.metadata || {}),
                },
                priority: 'high',
            }, {
                channelId: params.channel,
                sessionId: this.sessionId,
            }, {
                audit: this.getOrchestratorAudit({
                    channelId: params.channel,
                    sessionId: this.sessionId,
                }),
            });
            try {
                await this.redisClient.publish(`${this.config.REDIS_KEYS.EGRESS_PREFIX}:${params.targetSourceId}`, JSON.stringify(directEnvelope));
            }
            catch (error) {
                this.log('warn', 'SELF-PROMPT', `Failed targeted self-prompt publish for ${params.targetSourceId}: ${error.message}`);
            }
        }
        this.log('info', 'SELF-PROMPT', `Self-prompt issued (${params.kind})`, {
            channel: params.channel,
            targetAgentId: params.targetAgentId,
            targetProcessId: params.targetProcessId,
            reason: params.reason,
        });
    }
}
exports.SelfPromptService = SelfPromptService;
//# sourceMappingURL=self-prompt.service.js.map