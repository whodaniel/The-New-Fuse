import { window, commands, workspace, languages, WebviewPanel } from 'vscode';
import { EventEmitter } from 'events';

export class TraeMonitor extends EventEmitter {
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private redisClient: any | null = null;
  private readonly env: string = process.env.NODE_ENV || 'development';

  private commandHistory: Array<{command: string, args: unknown[], timestamp: Date, source: string}> = [];

  constructor() {
    super();
    if (this.env === 'production') {
      const redisUrl = process.env.REDIS_URL;
      if (redisUrl) {
        this.redisClient = new (require('ioredis'))(redisUrl);
      }
    }
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    // Monitor all command executions
    commands.onDidExecuteCommand(async event => {
      const startTime = Date.now();
      try {
        if (event.command.startsWith('trae.') || event.command.startsWith('augment.')) {
          const source = this.determineSource(event);
          await this.recordCommand(event);
          this.metricsCollector.trackExecution({
            command: event.command,
            source,
            duration: Date.now() - startTime,
            success: true
          });
        }
      } catch (error) {
        this.emit('monitor-error', { 
          error,
          command: event.command,
          timestamp: new Date() 
        });
      }
    });

    // Monitor file system changes
    workspace.onDidChangeTextDocument(event => {
      // Large or structured changes likely from Trae
      if (event.contentChanges.length > 1 ||
          event.contentChanges.some(change => change.text.includes('\n'))) {
        this.recordFileChange(event);
      }
    });

    // Monitor diagnostic messages
    languages.onDidChangeDiagnostics(event => {
      this.recordDiagnostics(event);
    });

    // Monitor webview messages
    window.onDidCreateWebviewPanel(panel => {
      if (panel.viewType.includes('trae')) {
        this.monitorWebview(panel);
      }
    });
  }

  private determineSource(event: any): string {
    // Use command metadata for source detection
    return event?.metadata?.source || 
      (event.command.startsWith('trae.') ? 'trae' : 'user');
  }

  public enableMetricsReporting(intervalMs = 60000) {
    setInterval(() => this.publishMetrics(), intervalMs);
  }

  private async publishMetrics() {
    const metrics = this.metricsCollector.getMetrics();
    if (this.redisClient) {
      await this.redisClient.publish('trae:metrics', JSON.stringify({
        timestamp: new Date().toISOString(),
        metrics
      }));
    }
  }

  public startHeartbeat(intervalMs = 30000) {
    this.heartbeatInterval = setInterval(() => {
      this.emit('heartbeat', {
        timestamp: new Date().toISOString(),
        status: 'active',
        metricsCount: this.metricsCollector.executions.size
      });
    }, intervalMs);
  }

  public async cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }

  private metricsCollector = {
    executions: new Map<string, number>(),
    trackExecution(metric: {
      command: string,
      source: string,
      duration: number,
      success: boolean
    }) {
      const key = `${metric.command}-${metric.source}`;
      this.executions.set(key, (this.executions.get(key) || 0) + 1);
    },
    getMetrics() {
      return Array.from(this.executions.entries()).map(([key, count]) => {
        const [command, source] = key.split('-');
        return { command, source, count };
      });
    }
  };

  private monitorWebview(panel: WebviewPanel) {
    panel.webview.onDidReceiveMessage(message => {
      this.emit('webview-message', {
        timestamp: Date.now(),
        command: message.command,
        args: message.args,
        source: panel.viewType,
        message
      });
    });
  }
}