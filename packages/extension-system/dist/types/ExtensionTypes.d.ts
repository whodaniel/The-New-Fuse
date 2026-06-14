/**
 * Unified Extension Types for The New Fuse Framework
 *
 * Consolidates module, plugin, and extension definitions into a single type system
 * Provides comprehensive interfaces for extension lifecycle management
 */
import { MasterAgentRegistry } from '@the-new-fuse/relay-core';
export interface WorkflowNode {
    id: string;
    type: string;
    execute(context: any): Promise<any>;
}
export interface UnifiedExtension {
    id: string;
    name: string;
    version: string;
    type: ExtensionType;
    description?: string;
    author: string;
    homepage?: string;
    repository?: string;
    license?: string;
    keywords: string[];
    category: ExtensionCategory;
    status: ExtensionStatus;
    loadedAt?: Date;
    unloadedAt?: Date;
    dependencies: ExtensionDependency[];
    peerDependencies: ExtensionDependency[];
    optionalDependencies: ExtensionDependency[];
    configuration: ExtensionConfiguration;
    permissions: ExtensionPermission[];
    instance?: any;
    context?: ExtensionContext;
    metadata: ExtensionMetadata;
    manifest: ExtensionManifest;
}
export declare enum ExtensionType {
    NESTJS_MODULE = "nestjs_module",
    WORKFLOW_NODE = "workflow_node",
    WORKFLOW_TRIGGER = "workflow_trigger",
    WORKFLOW_VALIDATOR = "workflow_validator",
    AGENT_CAPABILITY = "agent_capability",
    AGENT_PROTOCOL = "agent_protocol",
    AGENT_HANDOFF_TEMPLATE = "agent_handoff_template",
    RELAY_TRANSPORT = "relay_transport",
    MESSAGE_HANDLER = "message_handler",
    API_INTEGRATION = "api_integration",
    DATABASE_CONNECTOR = "database_connector",
    AUTHENTICATION_PROVIDER = "auth_provider",
    VSCODE_EXTENSION = "vscode_extension",
    CHROME_EXTENSION = "chrome_extension",
    WEB_COMPONENT = "web_component",
    DEVELOPER_TOOL = "developer_tool",
    DEBUG_PLUGIN = "debug_plugin",
    TESTING_FRAMEWORK = "testing_framework",
    MONITORING_PLUGIN = "monitoring_plugin",
    METRICS_COLLECTOR = "metrics_collector",
    CUSTOM = "custom"
}
export declare enum ExtensionCategory {
    CORE = "core",
    WORKFLOW = "workflow",
    AGENT = "agent",
    COMMUNICATION = "communication",
    INTEGRATION = "integration",
    UI = "ui",
    DEVELOPMENT = "development",
    ANALYTICS = "analytics",
    UTILITY = "utility",
    EXPERIMENTAL = "experimental"
}
export declare enum ExtensionStatus {
    UNLOADED = "unloaded",
    LOADING = "loading",
    LOADED = "loaded",
    ACTIVE = "active",
    INACTIVE = "inactive",
    ERROR = "error",
    DISABLED = "disabled",
    UNLOADING = "unloading"
}
export interface ExtensionDependency {
    name: string;
    version: string;
    type: 'extension' | 'npm' | 'service' | 'api';
    required: boolean;
    resolved?: boolean;
    resolvedVersion?: string;
}
export interface ExtensionConfiguration {
    schema?: any;
    defaults: Record<string, any>;
    current: Record<string, any>;
    userOverrides: Record<string, any>;
    environmentOverrides: Record<string, any>;
}
export interface ExtensionPermission {
    name: string;
    description: string;
    type: PermissionType;
    granted: boolean;
    required: boolean;
    requestedAt?: Date;
    grantedAt?: Date;
}
export declare enum PermissionType {
    FILE_SYSTEM_READ = "filesystem_read",
    FILE_SYSTEM_WRITE = "filesystem_write",
    NETWORK_ACCESS = "network_access",
    DATABASE_ACCESS = "database_access",
    AGENT_CONTROL = "agent_control",
    WORKFLOW_MODIFY = "workflow_modify",
    SYSTEM_INFO = "system_info",
    USER_DATA = "user_data",
    SENSITIVE_DATA = "sensitive_data",
    EXECUTION_CONTEXT = "execution_context"
}
export interface ExtensionContext {
    extensionId: string;
    workingDirectory: string;
    configDirectory: string;
    logDirectory: string;
    tempDirectory: string;
    environment: 'development' | 'staging' | 'production';
    userId?: string;
    agentRegistry?: MasterAgentRegistry;
    workflowEngine?: any;
    logger?: any;
    eventBus?: any;
}
export interface ExtensionMetadata {
    apiVersion: string;
    frameworkVersion: string;
    buildTime?: Date;
    gitCommit?: string;
    buildNumber?: string;
    compatibility: {
        node: string;
        framework: string;
        platform: string[];
    };
    loadTime?: number;
    memoryUsage?: number;
    checksum?: string;
    signature?: string;
    customProperties: Record<string, any>;
}
export interface ExtensionManifest {
    name: string;
    version: string;
    main: string;
    description?: string;
    author?: string | ExtensionAuthor;
    license?: string;
    homepage?: string;
    repository?: string | ExtensionRepository;
    bugs?: string | {
        url: string;
        email?: string;
    };
    type: ExtensionType;
    category: ExtensionCategory;
    keywords: string[];
    exports?: Record<string, string>;
    bin?: Record<string, string>;
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
    configuration?: any;
    permissions?: string[];
    hooks?: ExtensionHooks;
    assets?: string[];
    styles?: string[];
    scripts?: string[];
    platform?: {
        node?: string;
        vscode?: string;
        chrome?: string;
        web?: boolean;
    };
}
export interface ExtensionAuthor {
    name: string;
    email?: string;
    url?: string;
}
export interface ExtensionRepository {
    type: string;
    url: string;
    directory?: string;
}
export interface ExtensionHooks {
    beforeLoad?: string;
    afterLoad?: string;
    beforeUnload?: string;
    afterUnload?: string;
    onConfigChange?: string;
    onError?: string;
}
export interface ExtensionLifecycle {
    onLoad?(context: ExtensionContext): Promise<void> | void;
    onUnload?(context: ExtensionContext): Promise<void> | void;
    onActivate?(context: ExtensionContext): Promise<void> | void;
    onDeactivate?(context: ExtensionContext): Promise<void> | void;
    onConfigChange?(config: Record<string, any>, context: ExtensionContext): Promise<void> | void;
    onError?(error: Error, context: ExtensionContext): Promise<void> | void;
}
export interface ExtensionValidationResult {
    valid: boolean;
    errors: ExtensionValidationError[];
    warnings: ExtensionValidationWarning[];
}
export interface ExtensionValidationError {
    code: string;
    message: string;
    field?: string;
    severity: 'error' | 'warning';
}
export interface ExtensionValidationWarning {
    code: string;
    message: string;
    field?: string;
    suggestion?: string;
}
export interface ExtensionRegistryEntry {
    extension: UnifiedExtension;
    registeredAt: Date;
    lastUpdated: Date;
    downloads: number;
    rating?: number;
    reviews?: ExtensionReview[];
}
export interface ExtensionReview {
    id: string;
    userId: string;
    rating: number;
    comment?: string;
    version: string;
    createdAt: Date;
}
export interface ExtensionLoadOptions {
    force?: boolean;
    skipValidation?: boolean;
    skipDependencies?: boolean;
    configOverrides?: Record<string, any>;
    permissionOverrides?: Record<string, boolean>;
}
export interface ExtensionLoadResult {
    success: boolean;
    extension?: UnifiedExtension;
    error?: Error;
    warnings: string[];
    loadTime: number;
}
export interface ExtensionManagerConfig {
    extensionDirectory: string;
    configDirectory: string;
    logDirectory: string;
    tempDirectory: string;
    enableAutoUpdate: boolean;
    enableSandboxing: boolean;
    maxLoadTime: number;
    maxMemoryUsage: number;
    allowDevelopmentExtensions: boolean;
    trustedSources: string[];
}
export interface ExtensionStats {
    total: number;
    loaded: number;
    active: number;
    error: number;
    disabled: number;
    byType: Record<ExtensionType, number>;
    byCategory: Record<ExtensionCategory, number>;
    totalLoadTime: number;
    totalMemoryUsage: number;
}
export interface NestJSModuleExtension extends UnifiedExtension {
    type: ExtensionType.NESTJS_MODULE;
    moduleClass: new (...args: any[]) => any;
    imports?: any[];
    providers?: any[];
    controllers?: any[];
    exports?: any[];
}
export interface WorkflowNodeExtension extends UnifiedExtension {
    type: ExtensionType.WORKFLOW_NODE;
    nodeType: string;
    nodeClass: new (...args: any[]) => WorkflowNode;
    defaultConfig: Record<string, any>;
    inputSchema?: any;
    outputSchema?: any;
}
export interface AgentCapabilityExtension extends UnifiedExtension {
    type: ExtensionType.AGENT_CAPABILITY;
    capabilityName: string;
    capabilityClass: new (...args: any[]) => any;
    supportedAgentTypes: string[];
    configurationSchema?: any;
}
export interface VSCodeExtensionWrapper extends UnifiedExtension {
    type: ExtensionType.VSCODE_EXTENSION;
    extensionPath: string;
    packageJson: any;
    activationEvents: string[];
    contributes: any;
}
export interface ExtensionDiscoverySource {
    type: 'directory' | 'npm' | 'git' | 'url' | 'registry';
    location: string;
    priority: number;
    enabled: boolean;
    credentials?: {
        username?: string;
        password?: string;
        token?: string;
    };
}
export interface ExtensionDiscoveryResult {
    found: ExtensionManifest[];
    errors: Array<{
        source: string;
        error: Error;
    }>;
}
export interface ExtensionEvent {
    type: ExtensionEventType;
    extensionId: string;
    timestamp: Date;
    data?: Record<string, any>;
}
export declare enum ExtensionEventType {
    EXTENSION_DISCOVERED = "extension_discovered",
    EXTENSION_LOADED = "extension_loaded",
    EXTENSION_UNLOADED = "extension_unloaded",
    EXTENSION_ACTIVATED = "extension_activated",
    EXTENSION_DEACTIVATED = "extension_deactivated",
    EXTENSION_ERROR = "extension_error",
    EXTENSION_CONFIG_CHANGED = "extension_config_changed",
    DEPENDENCY_RESOLVED = "dependency_resolved",
    DEPENDENCY_FAILED = "dependency_failed"
}
export interface ExtensionAPI {
    getExtension(id: string): UnifiedExtension | null;
    getAllExtensions(): UnifiedExtension[];
    getExtensionsByType(type: ExtensionType): UnifiedExtension[];
    getExtensionsByCategory(category: ExtensionCategory): UnifiedExtension[];
    loadExtension(path: string, options?: ExtensionLoadOptions): Promise<ExtensionLoadResult>;
    unloadExtension(id: string): Promise<boolean>;
    activateExtension(id: string): Promise<boolean>;
    deactivateExtension(id: string): Promise<boolean>;
    getExtensionConfig(id: string): Record<string, any>;
    setExtensionConfig(id: string, config: Record<string, any>): Promise<boolean>;
    onExtensionEvent(callback: (event: ExtensionEvent) => void): void;
    offExtensionEvent(callback: (event: ExtensionEvent) => void): void;
    discoverExtensions(sources?: ExtensionDiscoverySource[]): Promise<ExtensionDiscoveryResult>;
    getExtensionStats(): ExtensionStats;
    getExtensionHealth(id: string): ExtensionHealthStatus;
}
export interface ExtensionHealthStatus {
    healthy: boolean;
    lastChecked: Date;
    uptime: number;
    memoryUsage: number;
    cpuUsage?: number;
    errors: number;
    warnings: number;
    dependencies: {
        resolved: number;
        failed: number;
    };
}
export interface ExtensionFactory<T extends UnifiedExtension = UnifiedExtension> {
    create(manifest: ExtensionManifest, context: ExtensionContext): Promise<T>;
    validate(manifest: ExtensionManifest): ExtensionValidationResult;
    getType(): ExtensionType;
}
export interface ExtensionSandbox {
    id: string;
    extensionId: string;
    environment: 'node' | 'worker' | 'iframe' | 'container';
    permissions: ExtensionPermission[];
    resourceLimits: {
        memory: number;
        cpu: number;
        time: number;
        network: boolean;
        filesystem: boolean;
    };
    execute<T = any>(code: string, args?: any[]): Promise<T>;
    cleanup(): Promise<void>;
}
export interface ExtensionUpdate {
    extensionId: string;
    currentVersion: string;
    newVersion: string;
    changelog?: string;
    breaking: boolean;
    migrationRequired: boolean;
    migrationScript?: string;
}
export interface ExtensionMigration {
    fromVersion: string;
    toVersion: string;
    script: string;
    description: string;
    automatic: boolean;
}
export declare function isNestJSModuleExtension(ext: UnifiedExtension): ext is NestJSModuleExtension;
export declare function isWorkflowNodeExtension(ext: UnifiedExtension): ext is WorkflowNodeExtension;
export declare function isAgentCapabilityExtension(ext: UnifiedExtension): ext is AgentCapabilityExtension;
export declare function isVSCodeExtensionWrapper(ext: UnifiedExtension): ext is VSCodeExtensionWrapper;
//# sourceMappingURL=ExtensionTypes.d.ts.map