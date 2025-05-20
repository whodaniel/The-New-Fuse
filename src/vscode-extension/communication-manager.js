"use strict";
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
exports.CommunicationManager = void 0;
const vscode = __importStar(require("vscode"));
const workspace_state_transport_1 = require("./transports/workspace-state-transport");
const file_transport_1 = require("./transports/file-transport");
class CommunicationManager {
    constructor(context, workspaceRoot) {
        this.context = context;
        this.workspaceRoot = workspaceRoot;
        this.transports = [];
        this.messageHandlers = [];
    }
    async initialize() {
        // Initialize transports
        const workspaceTransport = new workspace_state_transport_1.WorkspaceStateTransport(this.context);
        const fileTransport = new file_transport_1.FileTransport(this.workspaceRoot);
        this.transports = [workspaceTransport, fileTransport];
        // Initialize all transports
        await Promise.all(this.transports.map(t => t.initialize()));
        // Subscribe to messages from all transports
        this.transports.forEach(transport => {
            transport.subscribeToMessages(async (message) => {
                await this.handleMessage(message);
            });
        });
    }
    async sendMessage(message) {
        // Try each transport until one succeeds
        for (const transport of this.transports) {
            try {
                const success = await transport.sendMessage(message);
                if (success) {
                    return true;
                }
            }
            catch (error) {
                console.error('Transport failed:', error);
            }
        }
        return false;
    }
    onMessage(handler) {
        this.messageHandlers.push(handler);
        return new vscode.Disposable(() => {
            this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
        });
    }
    async handleMessage(message) {
        for (const handler of this.messageHandlers) {
            try {
                await handler(message);
            }
            catch (error) {
                console.error('Message handler failed:', error);
            }
        }
    }
    dispose() {
        this.transports.forEach(t => t.dispose());
        this.transports = [];
        this.messageHandlers = [];
    }
}
exports.CommunicationManager = CommunicationManager;
//# sourceMappingURL=communication-manager.js.map