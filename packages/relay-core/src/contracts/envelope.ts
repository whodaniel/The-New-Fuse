// packages/relay-core/src/contracts/envelope.ts

export interface TnfAgentEnvelopeIdentity {
  agentId: string;
  canonicalEntityId?: string;
  operationalHandle: string;
  runtimeSessionId?: string;
  aliases: string[];
  role: 'orchestrator' | 'worker';
  platform: string;
}
