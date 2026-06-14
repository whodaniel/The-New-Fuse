/**
 * Extension System Types - The New Fuse
 *
 * This file consolidates the definitions for modules, plugins, and extensions,
 * creating a unified and authoritative source for all extension-related data structures.
 */
export declare enum ExtensionType {
    MODULE = "MODULE",
    PLUGIN = "PLUGIN",
    INTEGRATION = "INTEGRATION"
}
export declare enum ExtensionStatus {
    LOADED = "LOADED",
    UNLOADED = "UNLOADED",
    ENABLED = "ENABLED",
    DISABLED = "DISABLED",
    ERROR = "ERROR"
}
export interface ExtensionManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    type: ExtensionType;
    entryPoint: string;
    dependencies?: string[];
    hostVersion: string;
}
export interface Extension<T> {
    manifest: ExtensionManifest;
    status: ExtensionStatus;
    instance?: T;
    error?: string;
    load: () => Promise<void>;
    unload: () => Promise<void>;
    enable: () => Promise<void>;
    disable: () => Promise<void>;
}
export interface Module extends Extension<any> {
    getApi: () => any;
}
export interface Plugin extends Extension<any> {
    getUiComponents: () => any[];
}
export interface Integration extends Extension<any> {
    getEventListeners: () => any[];
}
//# sourceMappingURL=ExtensionTypes.d.ts.map