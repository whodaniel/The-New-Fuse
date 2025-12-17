import { ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'events';
import { join } from 'path';

// Safe logging to prevent EPIPE errors
const safeLog = (...args: any[]) => {
  try {
    console.log(...args);
  } catch (error) {
    // Silently ignore EPIPE errors in console output
  }
};

const safeError = (...args: any[]) => {
  try {
    console.error(...args);
  } catch (error) {
    // Silently ignore EPIPE errors in console output
  }
};

const safeWarn = (...args: any[]) => {
  try {
    console.warn(...args);
  } catch (error) {
    // Silently ignore EPIPE errors in console output
  }
};

export class HybridBackend extends EventEmitter {
  private nativeHost: ChildProcess | null = null;
  private isConnected = false;
  private buffer = '';

  constructor() {
    super();
  }

  async startNativeHost(): Promise<void> {
    try {
      const hostPath = join(__dirname, '../../native/host.py');
      safeLog('Starting native host from:', hostPath);
      safeLog('__dirname is:', __dirname);
      this.nativeHost = spawn('python3', [hostPath], {
        stdio: 'pipe',
      });

      this.nativeHost.stdout?.on('data', (data) => {
        try {
          this.buffer += data.toString();
          const lines = this.buffer.split('\n');
          this.buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine) {
              try {
                const response = JSON.parse(trimmedLine);
                this.emit('native-response', response);
              } catch (parseError) {
                safeError('Failed to parse JSON line:', trimmedLine);
                safeError('Parse error:', parseError);
              }
            }
          }
        } catch (error) {
          safeError('Failed to process native host data:', error);
        }
      });

      this.nativeHost.stderr?.on('data', (data) => {
        safeError('Native host error:', data.toString());
        this.emit('native-error', data.toString());
      });

      this.nativeHost.on('close', (code) => {
        safeLog(`Native host process exited with code ${code}`);
        this.isConnected = false;
        this.emit('native-disconnected');
      });

      this.isConnected = true;
      this.emit('native-connected');
    } catch (error) {
      safeError('Failed to start native host:', error);
      throw error;
    }
  }

  async stopNativeHost(): Promise<void> {
    if (this.nativeHost) {
      this.nativeHost.kill();
      this.nativeHost = null;
      this.isConnected = false;
    }
  }

  async sendCommand(command: string, args: string[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.nativeHost || !this.isConnected) {
        reject(new Error('Native host not connected'));
        return;
      }

      const requestId = Date.now().toString();
      const request = {
        id: requestId,
        command,
        args,
      };

      const responseHandler = (response: any) => {
        if (response.id === requestId) {
          this.removeListener('native-response', responseHandler);
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || 'Command failed'));
          }
        }
      };

      this.on('native-response', responseHandler);

      // Send the request
      this.nativeHost.stdin?.write(JSON.stringify(request) + '\n');

      // Set timeout
      setTimeout(() => {
        this.removeListener('native-response', responseHandler);
        reject(new Error('Command timeout'));
      }, 30000);
    });
  }

  getStatus(): { connected: boolean } {
    return { connected: this.isConnected };
  }

  // TNF Relay methods
  async connectTNFRelay(config: any): Promise<any> {
    return this.sendCommand('tnf_connect', [JSON.stringify(config)]);
  }

  async disconnectTNFRelay(): Promise<any> {
    return this.sendCommand('tnf_disconnect');
  }

  async getTNFRelayStatus(): Promise<any> {
    return this.sendCommand('tnf_status');
  }

  // MCP methods
  async connectMCP(config: any): Promise<any> {
    return this.sendCommand('mcp_connect', [JSON.stringify(config)]);
  }

  async disconnectMCP(): Promise<any> {
    return this.sendCommand('mcp_disconnect');
  }

  async getMCPStatus(): Promise<any> {
    return this.sendCommand('mcp_status');
  }

  // Port monitoring methods
  async addPortToMonitor(port: number): Promise<any> {
    return this.sendCommand('add_port', [port.toString()]);
  }

  async removePortFromMonitor(port: number): Promise<any> {
    return this.sendCommand('remove_port', [port.toString()]);
  }

  async getMonitoredPorts(): Promise<any> {
    return this.sendCommand('list_ports');
  }

  async getPortStatuses(): Promise<any> {
    return this.sendCommand('port_status');
  }

  // Native command execution
  async executeNativeCommand(command: string, args: string[]): Promise<any> {
    return this.sendCommand(command, args);
  }

  // Chrome extension integration
  async handleElementDetection(elementData: any): Promise<any> {
    return this.sendCommand('element_detected', [JSON.stringify(elementData)]);
  }

  async sendMessageToChrome(message: any): Promise<any> {
    return this.sendCommand('chrome_message', [JSON.stringify(message)]);
  }

  // System status
  async getSystemStatus(): Promise<any> {
    return this.sendCommand('system_status');
  }

  // Chat methods
  async processChatMessage(message: string): Promise<any> {
    return this.sendCommand('chat_message', [message]);
  }

  async getChatHistory(): Promise<any> {
    return this.sendCommand('chat_history');
  }

  // Lifecycle methods
  async initialize(): Promise<void> {
    await this.startNativeHost();
  }

  async shutdown(): Promise<void> {
    await this.stopNativeHost();
  }
}
