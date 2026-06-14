import { EventEmitter } from 'events';
export { ChatManager } from './chat/ChatManager.js';
export { PackageReconnectHub } from './package-reconnect/PackageReconnectHub.js';
export type { InternalPackageManifest, PackageProbeLoadMode, PackageProbeResult, } from './package-reconnect/types.js';
export declare class TNFCore extends EventEmitter {
    private _initialized;
    constructor();
    get initialized(): boolean;
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
}
