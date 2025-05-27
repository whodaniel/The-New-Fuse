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
exports.FileTransport = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
class FileTransport {
    constructor(workspaceRoot) {
        this.fileWatcher = null;
        this.handlers = [];
        this.communicationDir = path.join(workspaceRoot, '.thefuse', 'communication');
    }
    async initialize() {
        await fs.mkdir(this.communicationDir, { recursive: true });
        this.setupFileWatcher();
    }
    async sendMessage(message) {
        try {
            const fileName = `${Date.now()}-${message.id}.json`;
            const filePath = path.join(this.communicationDir, fileName);
            await fs.writeFile(filePath, JSON.stringify(message, null, 2));
            return true;
        }
        catch (error) {
            console.error('Failed to send message via file:', error);
            return false;
        }
    }
    subscribeToMessages(callback) {
        this.handlers.push(callback);
        return new vscode.Disposable(() => {
            this.handlers = this.handlers.filter(h => h !== callback);
        });
    }
    setupFileWatcher() {
        const pattern = new vscode.RelativePattern(this.communicationDir, '*.json');
        this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);
        this.fileWatcher.onDidCreate(async (uri) => {
            await this.handleMessageFile(uri);
        });
    }
    async handleMessageFile(uri) {
        try {
            const content = await fs.readFile(uri.fsPath, 'utf-8');
            const message = JSON.parse(content);
            for (const handler of this.handlers) {
                await handler(message);
            }
            // Archive processed message
            const archivePath = path.join(this.communicationDir, 'archived');
            await fs.mkdir(archivePath, { recursive: true });
            await fs.rename(uri.fsPath, path.join(archivePath, path.basename(uri.fsPath)));
        }
        catch (error) {
            console.error('Error handling message file:', error);
        }
    }
    dispose() {
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
            this.fileWatcher = null;
        }
    }
}
exports.FileTransport = FileTransport;
//# sourceMappingURL=file-transport.js.map