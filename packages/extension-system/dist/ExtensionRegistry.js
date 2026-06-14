"use strict";
/**
 * Extension Registry - The New Fuse
 *
 * Discovers and stores extensions from the filesystem.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionRegistry = void 0;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const relay_core_1 = require("@the-new-fuse/relay-core");
class ExtensionRegistry {
    constructor(logLevel, workspaceDir, extensionPaths) {
        this.extensions = new Map();
        this.logger = new relay_core_1.Logger(logLevel, workspaceDir);
        this.extensionPaths = extensionPaths;
    }
    async discoverExtensions() {
        const manifests = [];
        for (const dir of this.extensionPaths) {
            try {
                const files = await fs_1.promises.readdir(dir);
                for (const file of files) {
                    const extPath = path.join(dir, file);
                    if ((await fs_1.promises.stat(extPath)).isDirectory()) {
                        const manifestPath = path.join(extPath, 'package.json');
                        try {
                            const manifestContent = await fs_1.promises.readFile(manifestPath, 'utf-8');
                            const packageJson = JSON.parse(manifestContent);
                            if (packageJson.theNewFuseExtension) {
                                manifests.push(packageJson.theNewFuseExtension);
                            }
                        }
                        catch {
                            // Not an extension, or invalid manifest
                        }
                    }
                }
            }
            catch (error) {
                this.logger.error(`Failed to discover extensions in ${dir}: ${error}`);
            }
        }
        return manifests;
    }
    registerExtension(extension) {
        this.extensions.set(extension.manifest.id, extension);
        this.logger.info(`Extension registered: ${extension.manifest.name}`);
    }
    getExtension(extensionId) {
        return this.extensions.get(extensionId);
    }
    getAllExtensions() {
        return Array.from(this.extensions.values());
    }
}
exports.ExtensionRegistry = ExtensionRegistry;
//# sourceMappingURL=ExtensionRegistry.js.map