/**
 * Extension Registry - The New Fuse
 *
 * Discovers and stores extensions from the filesystem.
 */
import { LogLevel } from '@the-new-fuse/relay-core';
import { Extension, ExtensionManifest } from './ExtensionTypes.js';
export declare class ExtensionRegistry {
    private logger;
    private extensionPaths;
    private extensions;
    constructor(logLevel: LogLevel, workspaceDir: string, extensionPaths: string[]);
    discoverExtensions(): Promise<ExtensionManifest[]>;
    registerExtension(extension: Extension<any>): void;
    getExtension(extensionId: string): Extension<any> | undefined;
    getAllExtensions(): Extension<any>[];
}
//# sourceMappingURL=ExtensionRegistry.d.ts.map