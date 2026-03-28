/**
 * @the-new-fuse/extension-core - Constants
 */

export const DEFAULT_NODES = {
  relay: 'ws://localhost:3000/ws',
  apiGateway: 'http://localhost:8080',
  backend: 'http://localhost:3001',
  saas: 'http://localhost:3002',
  tnfWorker: 'https://tnf-agent-orchestration.bizsynth.workers.dev',
};

export const MESSAGE_TYPES = {
  AGENT_REGISTER: 'AGENT_REGISTER',
  AGENT_UNREGISTER: 'AGENT_UNREGISTER',
  MESSAGE_SEND: 'MESSAGE_SEND',
  MESSAGE_RECEIVE: 'MESSAGE_RECEIVE',
  INJECT_MESSAGE: 'INJECT_MESSAGE',
  RESPONSE_DETECTED: 'RESPONSE_DETECTED',
  RESPONSE_COMPLETE: 'RESPONSE_COMPLETE',
  HEARTBEAT: 'HEARTBEAT',
  WELCOME: 'WELCOME',
} as const;
