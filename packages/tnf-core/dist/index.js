import { EventEmitter } from 'events';
export { ChatManager } from './chat/ChatManager.js';
export { PackageReconnectHub } from './package-reconnect/PackageReconnectHub.js';
export class TNFCore extends EventEmitter {
    _initialized = false;
    constructor() {
        super();
    }
    get initialized() {
        return this._initialized;
    }
    async initialize() {
        this._initialized = true;
        this.emit('initialized');
    }
    async shutdown() {
        this._initialized = false;
        this.emit('shutdown');
    }
}
