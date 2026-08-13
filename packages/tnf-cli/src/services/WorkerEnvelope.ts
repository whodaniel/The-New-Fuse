import { v4 as uuidv4 } from 'uuid';

/** Envelope shape consumed by ~/.tnf/sub-director/run_one_envelope.py */
export interface WorkerTaskEnvelope {
  type: 'task';
  version: '1.0';
  payload: {
    id: string;
    timestamp: string;
    to: { agentId: string };
    payload: {
      task: {
        title: string;
        description: string;
        acceptanceCriteria?: string[];
      };
      source?: string;
      metadata?: Record<string, unknown>;
    };
  };
}

export function buildWorkerTaskEnvelope(input: {
  recipientAgentId: string;
  content: string;
  senderAgentId?: string;
  envelopeId?: string;
  title?: string;
  metadata?: Record<string, unknown>;
}): WorkerTaskEnvelope {
  const envelopeId = input.envelopeId || uuidv4();
  const title = input.title || 'tnf send dispatch';
  return {
    type: 'task',
    version: '1.0',
    payload: {
      id: envelopeId,
      timestamp: new Date().toISOString(),
      to: { agentId: input.recipientAgentId },
      payload: {
        task: {
          title,
          description: input.content,
          acceptanceCriteria: ['Respond or record outcome in run-artifacts'],
        },
        source: input.senderAgentId || 'tnf-cli',
        metadata: input.metadata,
      },
    },
  };
}

export function workerQueueKey(agentId: string): string {
  return `tnf:direct:sub-director:${agentId}`;
}

export function isSubDirectorWorker(agent: {
  role?: string;
  agentId?: string;
  id?: string;
}): boolean {
  const role = String(agent.role || '').toLowerCase();
  const id = String(agent.agentId || agent.id || '');
  return role === 'worker' || /worker/i.test(id);
}
