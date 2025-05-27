"use strict";
/**
 * File Protocol Communicator
 *
 * This module implements communication between VS Code extensions via shared files
 * in the workspace, as described in the inter-extension communication design document.
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
exports.FileProtocolCommunicator = void 0;
exports.createFileProtocolCommunicator = createFileProtocolCommunicator;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const utilities_1 = require("./utilities");
/**
 * Implements communication between extensions using shared files
 */
class FileProtocolCommunicator {
    constructor(context, agentClient, outputChannel) {
        this.communicationDir = 'ai-communication';
        this.processedMessageIds = new Set();
        this.context = context;
        this.agentClient = agentClient;
        this.agentId = 'thefuse.main';
        this.outputChannel = outputChannel;
        // Generate a secret key for message signing
        this.secretKey = this.context.globalState.get('thefuse.fileProtocol.secretKey') ||
            crypto.randomBytes(32).toString('hex');
        this.context.globalState.update('thefuse.fileProtocol.secretKey', this.secretKey);
    }
    /**
     * Initialize the communicator by setting up file watchers
     */
    async initialize() {
        try {
            // Get workspace folders
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                this.log('No workspace folder is open');
                return false;
            }
            // Get communication directory from settings
            const configDir = vscode.workspace.getConfiguration('theFuse').get('fileProtocolDir', 'ai-communication');
            this.communicationDir = configDir;
            // Create full path to communication directory
            const communicationDirPath = path.join(workspaceFolders[0].uri.fsPath, this.communicationDir);
            // Create the directory if it doesn't exist
            if (!fs.existsSync(communicationDirPath)) {
                fs.mkdirSync(communicationDirPath, { recursive: true });
                this.log(`Created communication directory: ${communicationDirPath}`);
            }
            // Create file watcher for .json files in the communication directory
            const pattern = new vscode.RelativePattern(communicationDirPath, '*.json');
            this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);
            // Watch for new files and changes
            this.fileWatcher.onDidCreate(uri => this.handleFileEvent(uri));
            this.fileWatcher.onDidChange(uri => this.handleFileEvent(uri));
            this.context.subscriptions.push(this.fileWatcher);
            this.log(`File protocol communicator initialized with directory: ${communicationDirPath}`);
            return true;
        }
        catch (error) {
            this.log(`Error initializing file protocol communicator: ${(0, utilities_1.getErrorMessage)(error)}`);
            return false;
        }
    }
    /**
     * Send a message to another extension by writing a file
     */
    async sendMessage(recipient, action, payload) {
        try {
            // Get workspace folders
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                this.log('No workspace folder is open');
                return { success: false };
            }
            // Generate message ID
            const messageId = crypto.randomUUID();
            // Create message object
            const message = {
                id: messageId,
                sender: this.agentId,
                recipient,
                action,
                payload,
                timestamp: Date.now(),
                status: 'pending'
            };
            // Add signature
            const messageToSign = { ...message };
            delete messageToSign.signature;
            message.signature = this.signMessage(messageToSign);
            // Create communication directory path
            const communicationDirPath = path.join(workspaceFolders[0].uri.fsPath, this.communicationDir);
            // Create the directory if it doesn't exist
            if (!fs.existsSync(communicationDirPath)) {
                fs.mkdirSync(communicationDirPath, { recursive: true });
            }
            // Create message file
            const filePath = path.join(communicationDirPath, `${Date.now()}-${messageId.substring(0, 8)}.json`);
            fs.writeFileSync(filePath, JSON.stringify(message, null, 2));
            this.log(`Sent message to ${recipient} via file: ${path.basename(filePath)}`);
            return { success: true, messageId };
        }
        catch (error) {
            this.log(`Error sending message: ${(0, utilities_1.getErrorMessage)(error)}`);
            return { success: false };
        }
    }
    /**
     * Handle file creation or change events
     */
    async handleFileEvent(uri) {
        try {
            // Read the file
            const content = fs.readFileSync(uri.fsPath, 'utf8');
            // Parse the message
            const message = JSON.parse(content);
            // Check if this message is for us
            if (message.recipient !== this.agentId && message.recipient !== '*') {
                return;
            }
            // Check if we've already processed this message
            if (this.processedMessageIds.has(message.id)) {
                return;
            }
            // Verify signature
            if (!this.verifyMessage(message)) {
                this.log(`Message signature verification failed: ${uri.fsPath}`);
                return;
            }
            // Mark as processing
            message.status = 'processing';
            await this.updateMessageFile(uri, message);
            // Process the message
            await this.processMessage(message);
            // Mark as processed
            message.status = 'processed';
            await this.updateMessageFile(uri, message);
            // Add to processed messages set
            this.processedMessageIds.add(message.id);
            // Keep the set from growing too large
            if (this.processedMessageIds.size > 1000) {
                const idsArray = Array.from(this.processedMessageIds);
                this.processedMessageIds = new Set(idsArray.slice(-500));
            }
        }
        catch (error) {
            this.log(`Error handling file event: ${(0, utilities_1.getErrorMessage)(error)}`);
        }
    }
    /**
     * Update a message file with new status
     */
    async updateMessageFile(uri, message) {
        try {
            // Write updated message back to file
            fs.writeFileSync(uri.fsPath, JSON.stringify(message, null, 2));
        }
        catch (error) {
            this.log(`Error updating message file: ${(0, utilities_1.getErrorMessage)(error)}`);
        }
    }
    /**
     * Process a message by routing it through the agent client system
     */
    async processMessage(message) {
        try {
            this.log(`Processing file protocol message from ${message.sender}: ${message.action}`);
            // Route the message to subscribers
            const routedMessage = {
                id: message.id,
                sender: message.sender,
                recipient: message.recipient,
                action: message.action,
                payload: message.payload,
                timestamp: message.timestamp,
                source: 'file-protocol'
            };
            // Process this internally within the agent client
            this.agentClient.subscribe(async (msg) => {
                if (msg.id === routedMessage.id) {
                    // Process the message (will be handled by other subscribers)
                    this.log(`Message ${message.id} routing complete`);
                }
            });
            // Send response if needed
            if (message.action.endsWith('Request')) {
                const responseAction = message.action.replace('Request', 'Response');
                await this.agentClient.sendMessage(message.sender, responseAction, {
                    requestId: message.id,
                    timestamp: Date.now(),
                    success: true
                });
            }
        }
        catch (error) {
            this.log(`Error processing message: ${(0, utilities_1.getErrorMessage)(error)}`);
        }
    }
    /**
     * Sign a message using HMAC
     */
    signMessage(message) {
        const messageStr = JSON.stringify(message);
        const hmac = crypto.createHmac('sha256', this.secretKey);
        hmac.update(messageStr);
        return hmac.digest('hex');
    }
    /**
     * Verify a message signature
     */
    verifyMessage(message) {
        if (!message.signature)
            return false;
        const signature = message.signature;
        const messageToVerify = { ...message };
        delete messageToVerify.signature;
        const expectedSignature = this.signMessage(messageToVerify);
        return signature === expectedSignature;
    }
    /**
     * Log a message to the output channel
     */
    log(message) {
        this.outputChannel.appendLine(`[File Protocol] ${message}`);
    }
    /**
     * Dispose of resources
     */
    dispose() {
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
        }
    }
}
exports.FileProtocolCommunicator = FileProtocolCommunicator;
/**
 * Create a file protocol communicator
 */
function createFileProtocolCommunicator(context, agentClient, outputChannel) {
    return new FileProtocolCommunicator(context, agentClient, outputChannel);
}
//# sourceMappingURL=file-protocol-communicator.js.map