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
exports.WorkspaceStateTransport = void 0;
const vscode = __importStar(require("vscode"));
class WorkspaceStateTransport {
    constructor(context) {
        this.messageKey = 'thefuse.messages';
        this.pollInterval = null;
        this.context = context;
    }
    async initialize() {
        this.startPolling();
    }
    async sendMessage(message) {
        try {
            const messages = this.context.workspaceState.get(this.messageKey, []);
            messages.push(message);
            await this.context.workspaceState.update(this.messageKey, messages);
            return true;
        }
        catch (error) {
            console.error('Failed to send message via workspace state:', error);
            return false;
        }
    }
    subscribeToMessages(callback) {
        const handler = async () => {
            const messages = this.context.workspaceState.get(this.messageKey, []);
            const unprocessedMessages = messages.filter(m => !m.processed);
            for (const message of unprocessedMessages) {
                await callback(message);
                message.processed = true;
            }
            await this.context.workspaceState.update(this.messageKey, messages);
        };
        this.startPolling(handler);
        return new vscode.Disposable(() => {
            if (this.pollInterval) {
                clearInterval(this.pollInterval);
                this.pollInterval = null;
            }
        });
    }
    startPolling(handler) {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
        if (handler) {
            this.pollInterval = setInterval(handler, 1000);
        }
    }
    dispose() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }
}
exports.WorkspaceStateTransport = WorkspaceStateTransport;
//# sourceMappingURL=workspace-state-transport.js.map