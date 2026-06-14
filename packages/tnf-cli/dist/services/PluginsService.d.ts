export interface Plugin {
    name: string;
    version: string;
    description: string;
    author: string;
    repository?: string;
    homepage?: string;
    status: 'active' | 'installed' | 'disabled' | 'error';
    category: string;
    dependencies: string[];
    config?: Record<string, any>;
    installedAt: string;
    updatedAt: string;
}
export declare class PluginsService {
    private readonly pluginsDir;
    private readonly registryPath;
    constructor();
    private ensureDir;
    list(): Promise<Plugin[]>;
    install(name: string, version?: string): Promise<Plugin>;
    remove(name: string): Promise<void>;
    update(name?: string): Promise<Plugin[]>;
    enable(name: string): Promise<Plugin>;
    disable(name: string): Promise<Plugin>;
    getStatus(name: string): Promise<Plugin | undefined>;
    private save;
    /**
     * Discover real installed plugins/skills from the filesystem.
     * Scans .agent/skills/, .claude/skills/, and .gemini/config/plugins/.
     */
    private getDefaultPlugins;
    private findProjectRoot;
}
//# sourceMappingURL=PluginsService.d.ts.map