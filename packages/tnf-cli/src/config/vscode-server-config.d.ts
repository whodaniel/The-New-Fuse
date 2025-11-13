export interface VSCodeServerConfig {
    defaultAuthProvider: 'github' | 'microsoft';
    tunnelNamePattern: string;
    autoWorkspace: boolean;
    backgroundMode: boolean;
    verboseLogging: boolean;
    maxTunnels: number;
    tunnelTimeout: number;
    autoCleanup: boolean;
    extensions: string[];
    workspaceSettings: Record<string, any>;
}
export interface ProjectVSCodeServerConfig {
    tunnelName?: string;
    authProvider?: 'github' | 'microsoft';
    autoStart?: boolean;
    extensions?: string[];
    workspaceSettings?: Record<string, any>;
    port?: number;
    background?: boolean;
}
/**
 * VS Code Server Configuration Manager
 */
export declare class VSCodeServerConfigManager {
    private configDir;
    private globalConfigPath;
    private defaultConfig;
    constructor();
    /**
     * Get global configuration
     */
    getGlobalConfig(): Promise<VSCodeServerConfig>;
    /**
     * Set global configuration
     */
    setGlobalConfig(config: Partial<VSCodeServerConfig>): Promise<void>;
    /**
     * Get project-specific configuration
     */
    getProjectConfig(projectPath?: string): Promise<ProjectVSCodeServerConfig>;
    /**
     * Set project-specific configuration
     */
    setProjectConfig(config: ProjectVSCodeServerConfig, projectPath?: string): Promise<void>;
    /**
     * Get merged configuration (global + project)
     */
    getMergedConfig(projectPath?: string): Promise<VSCodeServerConfig & ProjectVSCodeServerConfig>;
    /**
     * Generate tunnel name based on pattern
     */
    generateTunnelName(pattern: string, projectPath?: string): string;
    /**
     * Validate configuration
     */
    validateConfig(config: Partial<VSCodeServerConfig>): string[];
    /**
     * Reset configuration to defaults
     */
    resetGlobalConfig(): Promise<void>;
    /**
     * Remove project configuration
     */
    removeProjectConfig(projectPath?: string): Promise<void>;
    /**
     * Get configuration summary
     */
    getConfigSummary(projectPath?: string): Promise<{
        global: VSCodeServerConfig;
        project: ProjectVSCodeServerConfig;
        merged: VSCodeServerConfig & ProjectVSCodeServerConfig;
        tunnelName: string;
    }>;
    /**
     * Export configuration
     */
    exportConfig(projectPath?: string): Promise<{
        global: VSCodeServerConfig;
        project: ProjectVSCodeServerConfig;
    }>;
    /**
     * Import configuration
     */
    importConfig(config: {
        global?: Partial<VSCodeServerConfig>;
        project?: ProjectVSCodeServerConfig;
    }, projectPath?: string): Promise<void>;
}
//# sourceMappingURL=vscode-server-config.d.ts.map