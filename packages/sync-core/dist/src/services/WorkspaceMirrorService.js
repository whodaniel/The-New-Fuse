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
exports.WorkspaceMirrorService = void 0;
const chokidar = __importStar(require("chokidar"));
const events_1 = require("events");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
/**
 * WorkspaceMirrorService
 *
 * Provides real-time, two-way file mirroring between a local workspace
 * and the remote cloud sandbox. Functions as a high-performance sync daemon, giving
 * the cloud execution environment a complete, real-time view of local files.
 */
class WorkspaceMirrorService extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.watcher = null;
        this.isConnected = false;
        this.pendingChanges = new Map();
        this.syncTimer = null;
        this.config = {
            syncIntervalMs: 500, // Default batching interval
            ignorePatterns: ['node_modules/**', '.git/**', 'dist/**'],
            ...config,
        };
    }
    /**
     * Start the mirroring daemon
     */
    async start() {
        console.log(`[WorkspaceMirror] Starting mirror daemon on ${this.config.localPath}`);
        // Connect to the remote endpoint (mock implementation of WebSocket)
        await this.connectToRemote();
        // Start watching local file system
        this.watcher = chokidar.watch(this.config.localPath, {
            ignored: this.config.ignorePatterns,
            persistent: true,
            ignoreInitial: true,
        });
        this.watcher
            .on('add', (filePath) => this.handleLocalChange('add', filePath))
            .on('change', (filePath) => this.handleLocalChange('change', filePath))
            .on('unlink', (filePath) => this.handleLocalChange('unlink', filePath))
            .on('unlinkDir', (filePath) => this.handleLocalChange('unlinkDir', filePath));
        // Start sync loop
        this.syncTimer = setInterval(() => this.flushChanges(), this.config.syncIntervalMs);
    }
    /**
     * Stop the mirroring daemon
     */
    async stop() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }
        if (this.watcher) {
            await this.watcher.close();
        }
        this.disconnectFromRemote();
        console.log('[WorkspaceMirror] Mirror daemon stopped.');
    }
    async connectToRemote() {
        // In a full implementation, this connects via WebSocket to the TNF Cloud Sandbox or API Gateway
        console.log(`[WorkspaceMirror] Connected to remote endpoint: ${this.config.remoteEndpoint}`);
        this.isConnected = true;
        // Listen for remote changes
        this.on('remote-change', this.applyRemoteChange.bind(this));
    }
    disconnectFromRemote() {
        this.isConnected = false;
    }
    async handleLocalChange(type, fullPath) {
        const relativePath = path.relative(this.config.localPath, fullPath);
        let content;
        if (type === 'add' || type === 'change') {
            try {
                content = await fs.readFile(fullPath, 'utf-8');
            }
            catch (error) {
                console.error(`[WorkspaceMirror] Failed to read file ${fullPath}:`, error);
                return;
            }
        }
        this.pendingChanges.set(relativePath, {
            type,
            path: relativePath,
            content,
            timestamp: Date.now(),
        });
    }
    /**
     * Flush pending local changes to the remote cloud sandbox
     */
    async flushChanges() {
        if (!this.isConnected || this.pendingChanges.size === 0)
            return;
        const changes = Array.from(this.pendingChanges.values());
        this.pendingChanges.clear();
        console.log(`[WorkspaceMirror] Flushing ${changes.length} changes to cloud...`);
        // In a real implementation, this broadcasts over the WebSocket connection
        // to the `cloud-sandbox` ensuring the remote container's volume stays in sync.
        this.emit('sync-out', {
            tenantId: this.config.tenantId,
            changes,
        });
    }
    /**
     * Apply changes received from the cloud sandbox to the local filesystem
     */
    async applyRemoteChange(change) {
        const fullPath = path.join(this.config.localPath, change.path);
        try {
            if (change.type === 'add' || change.type === 'change') {
                const dir = path.dirname(fullPath);
                await fs.mkdir(dir, { recursive: true });
                if (change.content !== undefined) {
                    await fs.writeFile(fullPath, change.content);
                }
            }
            else if (change.type === 'unlink') {
                await fs.unlink(fullPath).catch(() => { }); // Ignore if already deleted
            }
            else if (change.type === 'unlinkDir') {
                await fs.rmdir(fullPath, { recursive: true }).catch(() => { });
            }
            console.log(`[WorkspaceMirror] Applied remote change: ${change.type} ${change.path}`);
        }
        catch (error) {
            console.error(`[WorkspaceMirror] Failed to apply remote change for ${change.path}:`, error);
        }
    }
    // Used for testing/simulation
    simulateRemoteChange(change) {
        this.emit('remote-change', change);
    }
}
exports.WorkspaceMirrorService = WorkspaceMirrorService;
//# sourceMappingURL=WorkspaceMirrorService.js.map