"use strict";
/**
 * @the-new-fuse/extension-core - Constants
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MESSAGE_TYPES = exports.DEFAULT_NODES = void 0;
exports.DEFAULT_NODES = {
    relay: 'ws://127.0.0.1:3000/ws',
    apiGateway: 'http://localhost:8080',
    backend: 'http://localhost:3001',
    saas: 'http://localhost:3002',
    tnfWorker: 'https://tnf-agent-orchestration.bizsynth.workers.dev',
};
exports.MESSAGE_TYPES = {
    AGENT_REGISTER: 'AGENT_REGISTER',
    AGENT_UNREGISTER: 'AGENT_UNREGISTER',
    MESSAGE_SEND: 'MESSAGE_SEND',
    MESSAGE_RECEIVE: 'MESSAGE_RECEIVE',
    INJECT_MESSAGE: 'INJECT_MESSAGE',
    RESPONSE_DETECTED: 'RESPONSE_DETECTED',
    RESPONSE_COMPLETE: 'RESPONSE_COMPLETE',
    HEARTBEAT: 'HEARTBEAT',
    WELCOME: 'WELCOME',
};
//# sourceMappingURL=constants.js.map