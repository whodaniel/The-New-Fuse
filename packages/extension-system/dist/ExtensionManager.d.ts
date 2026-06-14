/**
 * Extension Manager - The New Fuse
 *
 * The central class for managing the lifecycle of extensions.
 * It orchestrates the loading, enabling, disabling, and unloading of extensions.
 */
import { EventEmitter } from 'events';
import { LogLevel } from '@the-new-fuse/relay-core';
import { Extension } from './ExtensionTypes.js';
export declare class ExtensionManager extends EventEmitter {
    private logger;
    private registry;
    private loader;
    private validator;
    constructor(logLevel: LogLevel, workspaceDir: string, extensionPaths: string[]);
    loadAllExtensions(): Promise<void>;
    enableExtension(extensionId: string): Promise<void>;
    disableExtension(extensionId: string): Promise<void>;
    getExtension(extensionId: string): Extension<any> | undefined;
    getAllExtensions(): Extension<any>[];
}
//# sourceMappingURL=ExtensionManager.d.ts.map