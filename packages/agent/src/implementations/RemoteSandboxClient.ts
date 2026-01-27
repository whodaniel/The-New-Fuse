/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { EventEmitter } from 'events';

import WebSocket from 'ws';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string;
  method: string;
  params?: Record<string, unknown>;
}

export class RemoteSandboxClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private pendingRequests = new Map<
    string,
    { resolve: (val: any) => void; reject: (err: any) => void }
  >();

  constructor(url: string = process.env.SANDBOX_URL || 'ws://localhost:3000') {
    super();
    this.url = url;
  }

  async connect() {
    return new Promise<void>((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.on('open', () => {
          console.log('[RemoteSandbox] Connected');
          resolve();
        });

        this.ws.on('message', (data) => {
          try {
            const msg = JSON.parse(data.toString());

            // Handle JSON-RPC Responses
            if (msg.jsonrpc === '2.0' && msg.id && this.pendingRequests.has(msg.id)) {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              const { resolve, reject } = this.pendingRequests.get(msg.id)!;
              if (msg.error) {
                reject(new Error(msg.error.message));
              } else {
                resolve(msg.result);
              }
              this.pendingRequests.delete(msg.id);
            }
            // Handle Broadcasts / Subscriptions (e.g. { type: 'screenshot', payload: ... })
            else if (msg.type && msg.payload) {
              this.emit('event', msg.type, msg.payload);
              this.emit(msg.type, msg.payload);
            }
            // Handle JSON-RPC Notifications
            else if (msg.jsonrpc === '2.0' && !msg.id && msg.method) {
              this.emit('notification', msg.method, msg.params);
            }
          } catch (e) {
            console.error('[RemoteSandbox] Parse error:', e);
          }
        });

        this.ws.on('error', (err) => {
          console.error('[RemoteSandbox] Error:', err);
          // Only reject if we haven't connected yet
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(err);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  async callTool(name: string, args: Record<string, unknown> = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect();
    }

    const id = Math.random().toString(36).substring(7);
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: { name, arguments: args },
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.ws!.send(JSON.stringify(request));

      // Timeout
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  // Convenience methods matching previous interfaces
  async runCommand(command: string) {
    return this.callTool('run_command', { command });
  }

  async browse(url: string) {
    return this.callTool('browser_navigate', { url });
  }
}
