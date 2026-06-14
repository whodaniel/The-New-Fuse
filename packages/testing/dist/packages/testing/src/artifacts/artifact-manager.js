"use strict";
/**
 * Test Artifact Generation Utilities for The New Fuse
 *
 * This module provides utilities for generating and managing test artifacts
 * such as snapshots, logs, and other outputs from tests.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.artifactMatchers = exports.artifactManager = exports.ArtifactManager = void 0;
exports.createArtifactMatcher = createArtifactMatcher;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const globals_1 = require("@jest/globals");
/**
 * Class for managing test artifacts
 */
class ArtifactManager {
    /**
     * Create a new ArtifactManager
     * @param options Options for the artifact manager
     */
    constructor(options) {
        this.baseDir = options?.baseDir || process.env.TEST_ARTIFACTS_DIR || path_1.default.join(process.cwd(), 'test-artifacts');
        this.runId = options?.runId || process.env.TEST_RUN_ID || `test-run-${Date.now()}`;
        // Ensure the base directory exists
        if (!fs_1.default.existsSync(this.baseDir)) {
            fs_1.default.mkdirSync(this.baseDir, { recursive: true });
        }
        // Ensure the run directory exists
        const runDir = this.getRunDirectory();
        if (!fs_1.default.existsSync(runDir)) {
            fs_1.default.mkdirSync(runDir, { recursive: true });
        }
    }
    /**
     * Get the directory for the current test run
     */
    getRunDirectory() {
        return path_1.default.join(this.baseDir, this.runId);
    }
    /**
     * Create a new artifact
     * @param options Options for creating the artifact
     * @returns Path to the created artifact
     */
    createArtifact(options) {
        const { name, content, extension = 'json', metadata = {}, stringify = true, pretty = true } = options;
        // Create a sanitized filename
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const sanitizedName = name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        const filename = `${sanitizedName}-${timestamp}.${extension}`;
        // Create the artifact path
        const artifactPath = path_1.default.join(this.getRunDirectory(), filename);
        // Prepare the content
        let fileContent;
        if (stringify) {
            // For JSON content
            const fullContent = {
                metadata: {
                    timestamp: new Date().toISOString(),
                    runId: this.runId,
                    ...metadata
                },
                content
            };
            fileContent = pretty
                ? JSON.stringify(fullContent, null, 2)
                : JSON.stringify(fullContent);
        }
        else {
            // For raw content (like images, text, etc.)
            fileContent = content.toString();
        }
        // Write the artifact to disk
        fs_1.default.writeFileSync(artifactPath, fileContent);
        return artifactPath;
    }
    /**
     * Create a snapshot artifact
     * @param name Name of the snapshot
     * @param data Data to snapshot
     * @param metadata Additional metadata
     * @returns Path to the created snapshot
     */
    createSnapshot(name, data, metadata = {}) {
        return this.createArtifact({
            name: `snapshot-${name}`,
            content: data,
            metadata: {
                category: 'snapshot',
                ...metadata
            }
        });
    }
    /**
     * Create a log artifact
     * @param name Name of the log
     * @param entries Log entries
     * @param metadata Additional metadata
     * @returns Path to the created log
     */
    createLog(name, entries, metadata = {}) {
        return this.createArtifact({
            name: `log-${name}`,
            content: entries,
            metadata: {
                category: 'log',
                ...metadata
            }
        });
    }
    /**
     * Create a report artifact
     * @param name Name of the report
     * @param data Report data
     * @param metadata Additional metadata
     * @returns Path to the created report
     */
    createReport(name, data, metadata = {}) {
        return this.createArtifact({
            name: `report-${name}`,
            content: data,
            metadata: {
                category: 'report',
                ...metadata
            }
        });
    }
    /**
     * List all artifacts for the current run
     * @returns Array of artifact paths
     */
    listArtifacts() {
        const runDir = this.getRunDirectory();
        if (!fs_1.default.existsSync(runDir)) {
            return [];
        }
        return fs_1.default.readdirSync(runDir)
            .filter(file => !file.startsWith('.'))
            .map(file => path_1.default.join(runDir, file));
    }
    /**
     * Get an artifact by name
     * @param name Name of the artifact
     * @returns Artifact content or null if not found
     */
    getArtifact(name) {
        const artifacts = this.listArtifacts();
        const artifact = artifacts.find(a => path_1.default.basename(a).includes(name));
        if (!artifact) {
            return null;
        }
        const content = fs_1.default.readFileSync(artifact, 'utf8');
        try {
            return JSON.parse(content);
        }
        catch (e) {
            return content;
        }
    }
}
exports.ArtifactManager = ArtifactManager;
/**
 * Create a Jest matcher for artifact generation
 * @param artifactManager Artifact manager instance
 * @returns Jest matcher
 */
function createArtifactMatcher(artifactManager) {
    return {
        /**
         * Custom matcher to generate an artifact from a value
         */
        toGenerateArtifact(received, name, metadata = {}) {
            const artifactPath = artifactManager.createArtifact({
                name,
                content: received,
                metadata
            });
            return {
                pass: true,
                message: () => `Generated artifact: ${artifactPath}`
            };
        }
    };
}
// --- Global Instance and Jest Integration ---
// Export a default instance for convenience in tests
exports.artifactManager = new ArtifactManager();
// Export matchers for explicit use if needed
exports.artifactMatchers = createArtifactMatcher(exports.artifactManager);
// Attempt to automatically extend Jest's expect if it's available globally.
// This requires '@types/jest' for compile-time safety.
try {
    if (typeof globals_1.expect !== 'undefined' && typeof globals_1.expect.extend === 'function') {
        globals_1.expect.extend(exports.artifactMatchers);
        // console.log('Successfully extended Jest expect with artifact matchers.'); // Optional debug log
    }
}
catch (error) {
    console.error('Could not automatically extend Jest expect:', error);
    // This might happen in non-Jest environments or if Jest types are missing.
}
// Default export remains the manager instance
exports.default = exports.artifactManager;
//# sourceMappingURL=artifact-manager.js.map