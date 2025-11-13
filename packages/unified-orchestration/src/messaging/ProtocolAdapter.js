"use strict";
/**
 * Protocol Adapters for Unified Message Routing
 *
 * This module provides adapters for different communication protocols,
 * enabling seamless message routing across WebSocket, Redis, HTTP, and file-based systems.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTPAdapter = exports.RedisAdapter = exports.WebSocketAdapter = void 0;
const eventemitter3_1 = require("eventemitter3");
const ws_1 = __importDefault(require("ws"));
const ioredis_1 = __importDefault(require("ioredis"));
const debug_1 = __importDefault(require("debug"));
const debug = (0, debug_1.default)('tnf:protocol-adapter');
/**
 * WebSocket Protocol Adapter
 */
class WebSocketAdapter extends eventemitter3_1.EventEmitter {
    config;
    protocol = 'websocket';
    connections = new Map();
    server;
    _isListening = false;
    constructor(config) {
        super();
        this.config = config;
    }
    async initialize() {
        if (this.config.port) {
            // Start WebSocket server
            this.server = new ws_1.default.Server({
                port: this.config.port,
                host: this.config.host || 'localhost'
            });
            this.server.on('connection', (ws, request) => {
                const clientId = this.extractClientId(request);
                this.connections.set(clientId, ws);
                ws.on('message', (data) => {
                    try {
                        const envelope = JSON.parse(data.toString());
                        this.emit('message:received', envelope);
                    }
                    catch (error) {
                        debug('Failed to parse WebSocket message: %o', error);
                        this.emit('error', error);
                    }
                });
                ws.on('close', () => {
                    this.connections.delete(clientId);
                });
                ws.on('error', (error) => {
                    debug('WebSocket connection error for %s: %o', clientId, error);
                    this.connections.delete(clientId);
                    this.emit('error', error);
                });
                this.emit('connection:established', this.protocol);
            });
            this._isListening = true;
        }
        // Connect to configured endpoints
        if (this.config.endpoints) {
            for (const [targetId, endpoint] of Object.entries(this.config.endpoints)) {
                await this.connectToEndpoint(targetId, endpoint);
            }
        }
    }
    async send(envelope, target) {
        const data = JSON.stringify(envelope);
        if (target) {
            // Send to specific target
            const connection = this.connections.get(target);
            if (!connection) {
                throw new Error(`No WebSocket connection to target: ${target});
      }

      if (connection.readyState === WebSocket.OPEN) {
        connection.send(data);
      } else {`);
                throw new Error(`WebSocket connection to ${target}`, is, not, open);
            }
        }
        else {
            // Broadcast to all connections
            const promises = Array.from(this.connections.entries()).map(([id, ws]) => {
                if (ws.readyState === ws_1.default.OPEN) {
                    return new Promise((resolve, reject) => {
                        ws.send(data, (error) => {
                            if (error)
                                reject(error);
                            else
                                resolve();
                        });
                    });
                }
                return Promise.resolve();
            });
            await Promise.all(promises);
        }
    }
    async *receive() {
        // This adapter is event-driven, messages are handled via events
        // This method is for compatibility with pull-based consumers
        yield* [];
    }
    async close() {
        // Close all client connections
        for (const [id, ws] of this.connections.entries()) {
            ws.close();
            this.connections.delete(id);
        }
        // Close server
        if (this.server) {
            await new Promise((resolve) => {
                this.server.close(() => resolve());
            });
        }
        this._isListening = false;
    }
    isConnected() {
        return this._isListening || this.connections.size > 0;
    }
    async connectToEndpoint(targetId, endpoint) {
        const ws = new ws_1.default(endpoint);
        return new Promise((resolve, reject) => {
            ws.on('open', () => {
                this.connections.set(targetId, ws);
                this.emit('connection:established', this.protocol);
                resolve();
            });
            ws.on('error', (error) => {
                reject(error);
            });
            ws.on('message', (data) => {
                try {
                    const envelope = JSON.parse(data.toString());
                    this.emit('message:received', envelope);
                }
                catch (error) {
                    this.emit('error', error);
                }
            });
            ws.on('close', () => {
                this.connections.delete(targetId);
                this.emit('connection:lost', this.protocol);
            });
        });
    }
    extractClientId(request) {
        // Extract client ID from request headers, URL, or generate one
        return request.headers['x-client-id'] ||
            request.url?.split('clientId=')[1]?.split('&')[0] ||
            client_$;
        {
            Date.now();
        }
        _$;
        {
            Math.random().toString(36).substr(2, 9);
        }
        ;
    }
}
exports.WebSocketAdapter = WebSocketAdapter;
/**
 * Redis Protocol Adapter
 */
class RedisAdapter extends eventemitter3_1.EventEmitter {
    config;
    protocol = 'redis';
    publisher;
    subscriber;
    _isConnected = false;
    constructor(config) {
        super();
        this.config = config;
        this.publisher = new ioredis_1.default(config);
        this.subscriber = new ioredis_1.default(config);
    }
    async initialize() {
        // Setup subscriber
        this.subscriber.on('message', (channel, message) => {
            try {
                const envelope = JSON.parse(message);
                envelope.transport.channel = channel;
                this.emit('message:received', envelope);
            }
            catch (error) {
                debug('Failed to parse Redis message: %o', error);
                this.emit('error', error);
            }
        });
        this.subscriber.on('error', (error) => {
            debug('Redis subscriber error: %o', error);
            this.emit('error', error);
            this._isConnected = false;
        });
        this.publisher.on('error', (error) => {
            debug('Redis publisher error: %o', error);
            this.emit('error', error);
            this._isConnected = false;
        });
        // Subscribe to configured channels
        if (this.config.channels) {
            await this.subscriber.subscribe(...this.config.channels);
        }
        this._isConnected = true;
        this.emit('connection:established', this.protocol);
    }
    async send(envelope, target) {
        const channel = target || envelope.transport.channel || 'default';
        const message = JSON.stringify(envelope);
        await this.publisher.publish(channel, message);
    }
    async *receive() {
        // Redis is event-driven, messages handled via subscription
        yield* [];
    }
    async close() {
        await Promise.all([
            this.publisher.quit(),
            this.subscriber.quit()
        ]);
        this._isConnected = false;
    }
    isConnected() {
        return this._isConnected;
    }
    async subscribe(channels) {
        await this.subscriber.subscribe(...channels);
    }
    async unsubscribe(channels) {
        await this.subscriber.unsubscribe(...channels);
    }
}
exports.RedisAdapter = RedisAdapter;
/**
 * HTTP Protocol Adapter
 */
class HTTPAdapter extends eventemitter3_1.EventEmitter {
    config;
    protocol = 'http';
    endpoints = new Map();
    constructor(config) {
        super();
        this.config = config;
        if (config.endpoints) {
            for (const [targetId, endpoint] of Object.entries(config.endpoints)) {
                this.endpoints.set(targetId, endpoint);
            }
        }
    }
    async initialize() {
        this.emit('connection:established', this.protocol);
    }
    async send(envelope, target) {
        const endpoint = target ? this.endpoints.get(target) : envelope.transport.endpoint;
        if (!endpoint) {
            `
      throw new Error(No HTTP endpoint configured for target: ${target}`;
            ;
        }
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...envelope.transport.headers
            },
            body: JSON.stringify(envelope),
            signal: AbortSignal.timeout(this.config.timeout || 30000)
        });
        if (!response.ok) {
            throw new Error(HTTP, request, failed, $, { response, : .status }, $, { response, : .statusText } `);
    }
  }

  async* receive(): AsyncIterable<MessageEnvelope> {
    // HTTP is typically request-response, not streaming
    // This would be implemented for webhook-style receiving
    yield* [];
  }

  async close(): Promise<void> {
    // Nothing to close for HTTP adapter
  }

  isConnected(): boolean {
    return true; // HTTP is connectionless
  }

  addEndpoint(targetId: string, endpoint: string): void {
    this.endpoints.set(targetId, endpoint);
  }

  removeEndpoint(targetId: string): boolean {
    return this.endpoints.delete(targetId);
  }
}

/**
 * File-based Protocol Adapter
 */
export class FileAdapter extends EventEmitter<ProtocolAdapterEvents> implements ProtocolAdapter {
  public readonly protocol: MessageProtocol = 'file';
  private watchedDirectories = new Set<string>();
  private watchers: any[] = [];

  constructor(
    private config: {
      baseDirectory: string;
      watchDirectories?: string[];
      fileExtension?: string;
    }
  ) {
    super();
  }

  async initialize(): Promise<void> {
    // Ensure base directory exists
    await fs.mkdir(this.config.baseDirectory, { recursive: true });

    // Setup file watchers
    if (this.config.watchDirectories) {
      for (const dir of this.config.watchDirectories) {
        await this.watchDirectory(dir);
      }
    }

    this.emit('connection:established', this.protocol);
  }

  async send(envelope: MessageEnvelope, target?: string): Promise<void> {
    const filename = ${envelope.message.id}${this.config.fileExtension || '.json'};
    const targetDir = target ? path.join(this.config.baseDirectory, target) : this.config.baseDirectory;
    const filePath = path.join(targetDir, filename);

    // Ensure target directory exists
    await fs.mkdir(targetDir, { recursive: true });

    // Write message to file
    await fs.writeFile(filePath, JSON.stringify(envelope, null, 2));
  }

  async* receive(): AsyncIterable<MessageEnvelope> {
    // File-based receiving would scan directories for new files
    // This is a simplified implementation
    const files = await fs.readdir(this.config.baseDirectory);

    for (const file of files) {
      if (file.endsWith(this.config.fileExtension || '.json')) {
        try {
          const filePath = path.join(this.config.baseDirectory, file);
          const content = await fs.readFile(filePath, 'utf8');
          const envelope: MessageEnvelope = JSON.parse(content);

          // Clean up processed file
          await fs.unlink(filePath);

          yield envelope;
        } catch (error) {
          debug('Failed to process file %s: %o', file, error);
          this.emit('error', error as Error);
        }
      }
    }
  }

  async close(): Promise<void> {
    // Close file watchers
    for (const watcher of this.watchers) {
      watcher.close();
    }
    this.watchers = [];
    this.watchedDirectories.clear();
  }

  isConnected(): boolean {
    return true; // File system is always "connected"
  }

  private async watchDirectory(directory: string): Promise<void> {
    const fullPath = path.join(this.config.baseDirectory, directory);
    await fs.mkdir(fullPath, { recursive: true });

    const watcher = await import('chokidar').then(chokidar =>
      chokidar.watch(fullPath, {
        ignored: /[\/\\]\./,
        persistent: true
      })
    );

    watcher.on('add', async (filePath: string) => {
      if (filePath.endsWith(this.config.fileExtension || '.json')) {
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const envelope: MessageEnvelope = JSON.parse(content);
          this.emit('message:received', envelope);

          // Clean up processed file
          await fs.unlink(filePath);
        } catch (error) {
          debug('Failed to process watched file %s: %o', filePath, error);
          this.emit('error', error as Error);
        }
      }
    });

    this.watchers.push(watcher);
    this.watchedDirectories.add(directory);
  }
}

/**
 * Direct/In-Memory Protocol Adapter
 */
export class DirectAdapter extends EventEmitter<ProtocolAdapterEvents> implements ProtocolAdapter {
  public readonly protocol: MessageProtocol = 'direct';
  private static instances = new Map<string, DirectAdapter>();
  private messageHandlers = new Map<string, (envelope: MessageEnvelope) => Promise<void>>();

  constructor(private instanceId: string) {
    super();
    DirectAdapter.instances.set(instanceId, this);
  }

  async initialize(): Promise<void> {
    this.emit('connection:established', this.protocol);
  }

  async send(envelope: MessageEnvelope, target?: string): Promise<void> {
    if (target) {
      const targetInstance = DirectAdapter.instances.get(target);
      if (targetInstance) {
        targetInstance.emit('message:received', envelope);
      } else {`);
            throw new Error(No, direct, adapter, instance, found);
            for (target; ; )
                : $;
            {
                target;
            }
            ``;
            ;
        }
    }
}
exports.HTTPAdapter = HTTPAdapter;
{
    // Broadcast to all instances except self
    for (const [id, instance] of DirectAdapter.instances.entries()) {
        if (id !== this.instanceId) {
            instance.emit('message:received', envelope);
        }
    }
}
async * receive();
AsyncIterable < UnifiedMessageTypes_1.MessageEnvelope > {
    // Direct adapter is event-driven
    yield
};
async;
close();
Promise < void  > {
    DirectAdapter, : .instances.delete(this.instanceId)
};
isConnected();
boolean;
{
    return DirectAdapter.instances.has(this.instanceId);
}
registerMessageHandler(messageType, string, handler, (envelope) => Promise);
void {
    this: .messageHandlers.set(messageType, handler)
};
getInstance(instanceId, string);
DirectAdapter | undefined;
{
    return DirectAdapter.instances.get(instanceId);
}
getAllInstances();
Map < string, DirectAdapter > {
    return: new Map(DirectAdapter.instances)
};
//# sourceMappingURL=ProtocolAdapter.js.map