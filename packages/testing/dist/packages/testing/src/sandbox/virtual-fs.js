"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirtualFileSystem = void 0;
const memfs_1 = require("memfs");
const path_1 = require("path");
class VirtualFileSystem {
    constructor(options = {}) {
        this.root = options.root || '/sandbox';
        this.reset(options.initialFiles);
    }
    /**
     * Reset the virtual filesystem to initial state
     */
    reset(initialFiles = {}) {
        memfs_1.vol.reset();
        for (const [path, content] of Object.entries(initialFiles)) {
            this.writeFile(path, content);
        }
    }
    /**
     * Write content to a file
     */
    writeFile(path, content) {
        const fullPath = this.resolvePath(path);
        memfs_1.vol.mkdirSync(this.getDirname(fullPath), { recursive: true });
        memfs_1.vol.writeFileSync(fullPath, content);
    }
    /**
     * Read content from a file
     */
    readFile(path) {
        const fullPath = this.resolvePath(path);
        // Explicitly cast to string, as readFileSync with 'utf-8' should return string
        return memfs_1.vol.readFileSync(fullPath, 'utf-8');
    }
    /**
     * Check if a file exists
     */
    exists(path) {
        return memfs_1.vol.existsSync(this.resolvePath(path));
    }
    /**
     * List files in a directory
     */
    listFiles(path = '/') {
        const fullPath = this.resolvePath(path);
        // Explicitly cast to string[], as readdirSync without encoding returns string[]
        return memfs_1.vol.readdirSync(fullPath);
    }
    /**
     * Delete a file or directory
     */
    delete(path) {
        const fullPath = this.resolvePath(path);
        memfs_1.vol.rmSync(fullPath, { recursive: true, force: true });
    }
    /**
     * Get file stats
     */
    getStats(path) {
        const fullPath = this.resolvePath(path);
        return memfs_1.vol.statSync(fullPath);
    }
    /**
     * Create a directory
     */
    mkdir(path) {
        const fullPath = this.resolvePath(path);
        memfs_1.vol.mkdirSync(fullPath, { recursive: true });
    }
    resolvePath(path) {
        return (0, path_1.join)(this.root, path);
    }
    getDirname(path) {
        const parts = path.split('/');
        parts.pop();
        return parts.join('/');
    }
}
exports.VirtualFileSystem = VirtualFileSystem;
//# sourceMappingURL=virtual-fs.js.map