export interface VirtualFileSystemOptions {
    root?: string;
    initialFiles?: Record<string, string>;
}
export declare class VirtualFileSystem {
    private root;
    constructor(options?: VirtualFileSystemOptions);
    /**
     * Reset the virtual filesystem to initial state
     */
    reset(initialFiles?: Record<string, string>): void;
    /**
     * Write content to a file
     */
    writeFile(path: string, content: string): void;
    /**
     * Read content from a file
     */
    readFile(path: string): string;
    /**
     * Check if a file exists
     */
    exists(path: string): boolean;
    /**
     * List files in a directory
     */
    listFiles(path?: string): string[];
    /**
     * Delete a file or directory
     */
    delete(path: string): void;
    /**
     * Get file stats
     */
    getStats(path: string): import("@jsonjoy.com/fs-node").Stats<number>;
    /**
     * Create a directory
     */
    mkdir(path: string): void;
    private resolvePath;
    private getDirname;
}
//# sourceMappingURL=virtual-fs.d.ts.map