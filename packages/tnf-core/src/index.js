import { EventEmitter } from 'events';
export { ChatManager } from './chat/ChatManager.js';
export { PackageReconnectHub } from './package-reconnect/PackageReconnectHub.js';
export class TNFCore extends EventEmitter {
    constructor() {
        super();
        this._initialized = false;
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
//# sourceMappingURL=index.js.map