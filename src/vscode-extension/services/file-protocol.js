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
exports.FileProtocolService = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const events_1 = require("events");
const uuid_1 = require("uuid");
const logging_1 = require("../core/logging");
class FileProtocolService extends events_1.EventEmitter {
    constructor() {
        super();
        this.processedMessages = new Set();
        this.maxProcessedMessages = 1000;
        this.logger = logging_1.Logger.getInstance();
        this.communicationDir = this.getConfiguredDirectory();
        this.secretKey = this.generateOrGetSecretKey();
    }
    static getInstance() {
        if (!FileProtocolService.instance) {
            FileProtocolService.instance = new FileProtocolService();
        }
        return FileProtocolService.instance;
    }
    getConfiguredDirectory() {
        const config = vscode.workspace.getConfiguration('thefuse');
        return config.get('fileProtocolDir', 'ai-communication');
    }
    generateOrGetSecretKey() {
        const config = vscode.workspace.getConfiguration('thefuse');
        let key = config.get('fileProtocolKey');
        if (!key) {
            key = crypto.randomBytes(32).toString('hex');
            config.update('fileProtocolKey', key, true);
        }
        return key;
    }
    async initialize() {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('No workspace folder is open');
            }
            const communicationPath = path.join(workspaceFolder.uri.fsPath, this.communicationDir);
            // Ensure communication directory exists
            if (!fs.existsSync(communicationPath)) {
                fs.mkdirSync(communicationPath, { recursive: true });
            }
            // Set up file watcher
            const pattern = new vscode.RelativePattern(communicationPath, '*.json');
            this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);
            this.fileWatcher.onDidCreate(uri => this.handleFileChange(uri));
            this.fileWatcher.onDidChange(uri => this.handleFileChange(uri));
            this.logger.info('File protocol service initialized');
            return true;
        }
        catch (error) {
            this.logger.error('Failed to initialize file protocol service:', error);
            return false;
        }
    }
    async handleFileChange(uri) {
        try {
            const content = await fs.promises.readFile(uri.fsPath, 'utf8');
            const message = JSON.parse(content);
            // Skip if already processed
            if (this.processedMessages.has(message.id)) {
                return;
            }
            // Verify signature
            if (!this.verifyMessageSignature(message)) {
                this.logger.warn(`Invalid signature for message ${message.id}`);
                return;
            }
            // Add to processed messages and maintain size limit
            this.processedMessages.add(message.id);
            if (this.processedMessages.size > this.maxProcessedMessages) {
                const [firstKey] = this.processedMessages;
                this.processedMessages.delete(firstKey);
            }
            // Emit message event
            this.emit('message', message);
            // Update message status
            message.status = 'processed';
            await this.writeMessage(message);
        }
        catch (error) {
            this.logger.error('Error handling file change:', error);
        }
    }
    verifyMessageSignature(message) {
        if (!message.signature)
            return false;
        const dataToVerify = JSON.stringify({
            id: message.id,
            sender: message.sender,
            recipient: message.recipient,
            action: message.action,
            payload: message.payload,
            timestamp: message.timestamp
        });
        const expectedSignature = crypto
            .createHmac('sha256', this.secretKey)
            .update(dataToVerify)
            .digest('hex');
        return message.signature === expectedSignature;
    }
    createMessageSignature(message) {
        const dataToSign = JSON.stringify({
            id: message.id,
            sender: message.sender,
            recipient: message.recipient,
            action: message.action,
            payload: message.payload,
            timestamp: message.timestamp
        });
        return crypto
            .createHmac('sha256', this.secretKey)
            .update(dataToSign)
            .digest('hex');
    }
    async sendMessage(recipient, action, payload) {
        try {
            const message = {
                id: (0, uuid_1.v4)(),
                sender: 'vscode',
                recipient,
                action,
                payload,
                timestamp: Date.now(),
                status: 'pending'
            };
            message.signature = this.createMessageSignature(message);
            await this.writeMessage(message);
            return message;
        }
        catch (error) {
            this.logger.error('Failed to send message:', error);
            throw error;
        }
    }
    async writeMessage(message) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder is open');
        }
        const filePath = path.join(workspaceFolder.uri.fsPath, this.communicationDir, `${message.id}.json`);
        await fs.promises.writeFile(filePath, JSON.stringify(message, null, 2));
    }
    dispose() {
        this.fileWatcher?.dispose();
        this.removeAllListeners();
        this.processedMessages.clear();
    }
}
exports.FileProtocolService = FileProtocolService;
//# sourceMappingURL=file-protocol.js.map