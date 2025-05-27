"use strict";
/**
 * Simplified Agent Communication Module
 *
 * This is a basic implementation to get started quickly.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentClient = void 0;
exports.initializeOrchestrator = initializeOrchestrator;
exports.createAgentClient = createAgentClient;
const crypto = __importStar(require("crypto"));
class AgentClient {
    constructor(context, agentId) {
        this.messageCallbacks = [];
        this.context = context;
        this.agentId = agentId;
        // Set up polling for workspace state messages
        setInterval(() => this.checkForMessages(), 1000);
    }
    // Register this agent
    async register(name, capabilities, version) {
        // Store registration in workspace state
        const registrations = this.context.workspaceState.get('thefuse.agentRegistrations', []);
        registrations.push({
            id: this.agentId,
            name,
            capabilities,
            version,
            timestamp: Date.now()
        });
        await this.context.workspaceState.update('thefuse.agentRegistrations', registrations);
        return true;
    }
    // Send a message to another agent
    async sendMessage(recipient, action, payload) {
        const message = {
            id: crypto.randomUUID(),
            sender: this.agentId,
            recipient,
            action,
            payload,
            timestamp: Date.now()
        };
        // Add message to workspace state
        const messages = this.context.workspaceState.get('thefuse.messages', []);
        messages.push(message);
        await this.context.workspaceState.update('thefuse.messages', messages);
        return true;
    }
    // Broadcast a message to all agents
    async broadcast(action, payload) {
        return this.sendMessage('*', action, payload);
    }
    // Subscribe to receive messages
    async subscribe(callback) {
        this.messageCallbacks.push(callback);
        return true;
    }
    // Check for new messages
    async checkForMessages() {
        const messages = this.context.workspaceState.get('thefuse.messages', []);
        if (messages.length === 0)
            return;
        // Find messages for this agent
        const myMessages = messages.filter(m => m.recipient === this.agentId ||
            m.recipient === '*');
        if (myMessages.length === 0)
            return;
        // Process messages
        for (const message of myMessages) {
            for (const callback of this.messageCallbacks) {
                await callback(message);
            }
        }
        // Remove processed messages
        const remainingMessages = messages.filter(m => m.recipient !== this.agentId &&
            m.recipient !== '*');
        await this.context.workspaceState.update('thefuse.messages', remainingMessages);
    }
}
exports.AgentClient = AgentClient;
// Export factory functions
function initializeOrchestrator(context) {
    // Simple placeholder for the full orchestrator
    return {
        getRegisteredAgents: () => {
            return context.workspaceState.get('thefuse.agentRegistrations', []);
        }
    };
}
function createAgentClient(context, agentId) {
    return new AgentClient(context, agentId);
}
//# sourceMappingURL=agent-communication-simple.js.map