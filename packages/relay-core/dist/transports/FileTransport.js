"use strict";
/**
 * File Transport for The New Fuse Relay System
 *
 * Based on relay-adapter.js:114 (file watching system)
 * Handles communication with CLI agents through file-based queues.
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileTransport = void 0;
const chokidar = __importStar(require("chokidar"));
const events_1 = require("events");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class FileTransport extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.name = 'file';
        this.watcher = null;
        this.messageHandlers = [];
        this.config = config;
        this.logger = config.logger;
        this.queueDir = path_1.default.join(this.config.workspaceDir, 'cli-relay-queue');
    }
    async start() {
        if (this.watcher) {
            this.logger.warn('File watcher is already running.');
            return true;
        }
        try {
            await promises_1.default.mkdir(this.queueDir, { recursive: true });
            this.watcher = chokidar.watch(path_1.default.join(this.queueDir, '*', 'outbox', '*.json'), {
                ignored: /\.|~$/,
                persistent: true,
                awaitWriteFinish: {
                    stabilityThreshold: 2000,
                    pollInterval: 100,
                },
            });
            this.watcher.on('add', this.handleFileAdd.bind(this));
            this.logger.info(`File transport started, watching ${this.queueDir}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to start file transport: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }
    async stop() {
        if (this.watcher) {
            await this.watcher.close();
            this.watcher = null;
            this.logger.info('File transport stopped.');
        }
    }
    async send(message) {
        const targetId = message.target;
        if (!targetId) {
            this.logger.warn('Cannot send file message without a target.');
            return false;
        }
        try {
            const inboxDir = path_1.default.join(this.queueDir, targetId, 'inbox');
            await promises_1.default.mkdir(inboxDir, { recursive: true });
            const filePath = path_1.default.join(inboxDir, `${message.id}.json`);
            await promises_1.default.writeFile(filePath, JSON.stringify(message, null, 2));
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send file message to ${targetId}: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }
    onMessage(handler) {
        this.messageHandlers.push(handler);
    }
    isConnected() {
        return this.watcher !== null;
    }
    async handleFileAdd(filePath) {
        try {
            const content = await promises_1.default.readFile(filePath, 'utf8');
            const message = JSON.parse(content);
            this.messageHandlers.forEach((handler) => handler(message));
            await promises_1.default.unlink(filePath);
        }
        catch (error) {
            this.logger.error(`Error processing file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
exports.FileTransport = FileTransport;
//# sourceMappingURL=FileTransport.js.map