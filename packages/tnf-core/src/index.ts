import { EventEmitter } from 'events';

export { ChatManager } from './chat/ChatManager.js';
export { PackageReconnectHub } from './package-reconnect/PackageReconnectHub.js';
export type {
  InternalPackageManifest,
  PackageProbeLoadMode,
  PackageProbeResult,
} from './package-reconnect/types.js';

export class TNFCore extends EventEmitter {
  private _initialized: boolean = false;

  constructor() {
    super();
  }

  get initialized(): boolean {
    return this._initialized;
  }

  async initialize(): Promise<void> {
    this._initialized = true;
    this.emit('initialized');
  }

  async shutdown(): Promise<void> {
    this._initialized = false;
    this.emit('shutdown');
  }
}
