import * as chokidar from 'chokidar';
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface WorkspaceMirrorConfig {
  localPath: string;
  remoteEndpoint: string;
  tenantId?: string;
  ignorePatterns?: string[];
  syncIntervalMs?: number;
}

export interface FileChange {
  type: 'add' | 'change' | 'unlink' | 'unlinkDir';
  path: string;
  content?: string;
  timestamp: number;
}

/**
 * WorkspaceMirrorService
 *
 * Provides real-time, two-way file mirroring between a local workspace
 * and the remote cloud sandbox. Functions as a high-performance sync daemon, giving
 * the cloud execution environment a complete, real-time view of local files.
 */
export class WorkspaceMirrorService extends EventEmitter {
  private watcher: chokidar.FSWatcher | null = null;
  private config: WorkspaceMirrorConfig;
  private isConnected = false;
  private pendingChanges: Map<string, FileChange> = new Map();
  private syncTimer: NodeJS.Timeout | null = null;

  constructor(config: WorkspaceMirrorConfig) {
    super();
    this.config = {
      syncIntervalMs: 500, // Default batching interval
      ignorePatterns: ['node_modules/**', '.git/**', 'dist/**'],
      ...config,
    };
  }

  /**
   * Start the mirroring daemon
   */
  public async start(): Promise<void> {
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
  public async stop(): Promise<void> {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    if (this.watcher) {
      await this.watcher.close();
    }
    this.disconnectFromRemote();
    console.log('[WorkspaceMirror] Mirror daemon stopped.');
  }

  private async connectToRemote(): Promise<void> {
    // In a full implementation, this connects via WebSocket to the TNF Cloud Sandbox or API Gateway
    console.log(`[WorkspaceMirror] Connected to remote endpoint: ${this.config.remoteEndpoint}`);
    this.isConnected = true;

    // Listen for remote changes
    this.on('remote-change', this.applyRemoteChange.bind(this));
  }

  private disconnectFromRemote(): void {
    this.isConnected = false;
  }

  private async handleLocalChange(
    type: 'add' | 'change' | 'unlink' | 'unlinkDir',
    fullPath: string
  ) {
    const relativePath = path.relative(this.config.localPath, fullPath);

    let content: string | undefined;
    if (type === 'add' || type === 'change') {
      try {
        content = await fs.readFile(fullPath, 'utf-8');
      } catch (error) {
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
  private async flushChanges(): Promise<void> {
    if (!this.isConnected || this.pendingChanges.size === 0) return;

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
  private async applyRemoteChange(change: FileChange): Promise<void> {
    const fullPath = path.join(this.config.localPath, change.path);

    try {
      if (change.type === 'add' || change.type === 'change') {
        const dir = path.dirname(fullPath);
        await fs.mkdir(dir, { recursive: true });
        if (change.content !== undefined) {
          await fs.writeFile(fullPath, change.content);
        }
      } else if (change.type === 'unlink') {
        await fs.unlink(fullPath).catch(() => {}); // Ignore if already deleted
      } else if (change.type === 'unlinkDir') {
        await fs.rmdir(fullPath, { recursive: true }).catch(() => {});
      }

      console.log(`[WorkspaceMirror] Applied remote change: ${change.type} ${change.path}`);
    } catch (error) {
      console.error(`[WorkspaceMirror] Failed to apply remote change for ${change.path}:`, error);
    }
  }

  // Used for testing/simulation
  public simulateRemoteChange(change: FileChange): void {
    this.emit('remote-change', change);
  }
}
