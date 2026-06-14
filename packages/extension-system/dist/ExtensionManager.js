"use strict";
/**
 * Extension Manager - The New Fuse
 *
 * The central class for managing the lifecycle of extensions.
 * It orchestrates the loading, enabling, disabling, and unloading of extensions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionManager = void 0;
const events_1 = require("events");
const relay_core_1 = require("@the-new-fuse/relay-core");
const ExtensionRegistry_js_1 = require("./ExtensionRegistry.js");
const ExtensionLoader_js_1 = require("./ExtensionLoader.js");
const ExtensionValidator_js_1 = require("./ExtensionValidator.js");
const ExtensionTypes_js_1 = require("./ExtensionTypes.js");
class ExtensionManager extends events_1.EventEmitter {
    constructor(logLevel, workspaceDir, extensionPaths) {
        super();
        this.logger = new relay_core_1.Logger(logLevel, workspaceDir);
        this.registry = new ExtensionRegistry_js_1.ExtensionRegistry(logLevel, workspaceDir, extensionPaths);
        this.loader = new ExtensionLoader_js_1.ExtensionLoader(logLevel, workspaceDir);
        this.validator = new ExtensionValidator_js_1.ExtensionValidator();
    }
    async loadAllExtensions() {
        this.logger.info('Loading all extensions...');
        const manifests = await this.registry.discoverExtensions();
        for (const manifest of manifests) {
            const validationResult = this.validator.validate(manifest);
            if (!validationResult.isValid) {
                this.logger.error(`Invalid manifest for extension ${manifest.id}: ${validationResult.errors.join(', ')}`);
                continue;
            }
            try {
                const extension = await this.loader.load(manifest);
                this.registry.registerExtension(extension);
                this.emit('extension_loaded', extension);
            }
            catch (error) {
                this.logger.error(`Failed to load extension ${manifest.id}: ${error}`);
            }
        }
        this.logger.info('All extensions loaded.');
    }
    async enableExtension(extensionId) {
        const extension = this.registry.getExtension(extensionId);
        if (!extension) {
            throw new Error(`Extension with id ${extensionId} not found.`);
        }
        if (extension.status === ExtensionTypes_js_1.ExtensionStatus.ENABLED) {
            return;
        }
        try {
            await extension.enable();
            extension.status = ExtensionTypes_js_1.ExtensionStatus.ENABLED;
            this.emit('extension_enabled', extension);
            this.logger.info(`Extension ${extensionId} enabled.`);
        }
        catch (error) {
            extension.status = ExtensionTypes_js_1.ExtensionStatus.ERROR;
            this.logger.error(`Failed to enable extension ${extensionId}: ${error}`);
            throw error;
        }
    }
    async disableExtension(extensionId) {
        const extension = this.registry.getExtension(extensionId);
        if (!extension) {
            throw new Error(`Extension with id ${extensionId} not found.`);
        }
        if (extension.status === ExtensionTypes_js_1.ExtensionStatus.DISABLED) {
            return;
        }
        try {
            await extension.disable();
            extension.status = ExtensionTypes_js_1.ExtensionStatus.DISABLED;
            this.emit('extension_disabled', extension);
            this.logger.info(`Extension ${extensionId} disabled.`);
        }
        catch (error) {
            extension.status = ExtensionTypes_js_1.ExtensionStatus.ERROR;
            this.logger.error(`Failed to disable extension ${extensionId}: ${error}`);
            throw error;
        }
    }
    getExtension(extensionId) {
        return this.registry.getExtension(extensionId);
    }
    getAllExtensions() {
        return this.registry.getAllExtensions();
    }
}
exports.ExtensionManager = ExtensionManager;
//# sourceMappingURL=ExtensionManager.js.map