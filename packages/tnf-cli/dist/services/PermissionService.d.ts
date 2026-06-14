export type PermissionAction = 'allow' | 'deny';
export interface PermissionRule {
    pattern: string;
    action: PermissionAction;
}
export interface PermissionConfig {
    bash: Record<string, PermissionAction>;
    read: Record<string, PermissionAction>;
    external_directory: Record<string, PermissionAction>;
}
export interface PermissionCheckResult {
    allowed: boolean;
    matchedRule?: string;
    action?: PermissionAction;
    source?: 'global' | 'project' | 'default';
}
export declare class PermissionService {
    private configDir;
    private globalConfig;
    private projectConfig;
    private projectRoot;
    constructor(configDir?: string, projectRoot?: string);
    private loadConfigFromPath;
    private loadGlobalConfig;
    private loadProjectConfig;
    private matchPattern;
    private checkRules;
    checkBashCommand(command: string): PermissionCheckResult;
    checkReadPath(filePath: string): PermissionCheckResult;
    checkExternalDirectory(dirPath: string): PermissionCheckResult;
    getEffectiveConfig(): {
        global: PermissionConfig | null;
        project: PermissionConfig | null;
    };
    listBashRules(): Array<{
        pattern: string;
        action: PermissionAction;
        source: 'global' | 'project';
    }>;
    listReadRules(): Array<{
        pattern: string;
        action: PermissionAction;
        source: 'global' | 'project';
    }>;
    listExternalDirectoryRules(): Array<{
        pattern: string;
        action: PermissionAction;
        source: 'global' | 'project';
    }>;
    addBashRule(pattern: string, action: PermissionAction, scope?: 'global' | 'project'): void;
    addReadRule(pattern: string, action: PermissionAction, scope?: 'global' | 'project'): void;
    addExternalDirectoryRule(pattern: string, action: PermissionAction, scope?: 'global' | 'project'): void;
    removeBashRule(pattern: string, scope?: 'global' | 'project'): boolean;
    removeReadRule(pattern: string, scope?: 'global' | 'project'): boolean;
    removeExternalDirectoryRule(pattern: string, scope?: 'global' | 'project'): boolean;
    stripJsoncCommentsPublic(content: string): string;
    private ensureConfig;
    private saveConfig;
}
//# sourceMappingURL=PermissionService.d.ts.map