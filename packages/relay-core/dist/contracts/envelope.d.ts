export interface TnfAgentEnvelopeIdentity {
    agentId: string;
    canonicalEntityId?: string;
    operationalHandle: string;
    runtimeSessionId?: string;
    aliases: string[];
    role: 'orchestrator' | 'worker';
    platform: string;
}
//# sourceMappingURL=envelope.d.ts.map