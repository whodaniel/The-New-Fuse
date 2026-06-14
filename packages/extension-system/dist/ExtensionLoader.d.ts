/**
 * Extension Loader - The New Fuse
 *
 * Responsible for loading the code of an extension from its entry point.
 */
import { LogLevel } from '@the-new-fuse/relay-core';
import { Extension, ExtensionManifest } from './ExtensionTypes.js';
export declare class ExtensionLoader {
    private logger;
    constructor(logLevel: LogLevel, workspaceDir: string);
    load(manifest: ExtensionManifest): Promise<Extension<any>>;
}
//# sourceMappingURL=ExtensionLoader.d.ts.map