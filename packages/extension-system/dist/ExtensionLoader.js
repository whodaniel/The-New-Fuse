"use strict";
/**
 * Extension Loader - The New Fuse
 *
 * Responsible for loading the code of an extension from its entry point.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionLoader = void 0;
const relay_core_1 = require("@the-new-fuse/relay-core");
const ExtensionTypes_js_1 = require("./ExtensionTypes.js");
class ExtensionLoader {
    constructor(logLevel, workspaceDir) {
        this.logger = new relay_core_1.Logger(logLevel, workspaceDir);
    }
    async load(manifest) {
        this.logger.info(`Loading extension: ${manifest.name}`);
        try {
            const module = await import(manifest.entryPoint);
            const instance = new module.default();
            const extension = {
                manifest,
                instance,
                status: ExtensionTypes_js_1.ExtensionStatus.LOADED,
                load: async () => { },
                unload: async () => { },
                enable: instance.enable ? instance.enable.bind(instance) : async () => { },
                disable: instance.disable ? instance.disable.bind(instance) : async () => { },
            };
            return extension;
        }
        catch (error) {
            this.logger.error(`Failed to load extension ${manifest.id}: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
}
exports.ExtensionLoader = ExtensionLoader;
//# sourceMappingURL=ExtensionLoader.js.map