/**
 * Unified Extension Types for The New Fuse Framework
 * 
 * Consolidates module, plugin, and extension definitions into a single type system
 * Provides comprehensive interfaces for extension lifecycle management
 */

import { WorkflowNode } from '@the-new-fuse/workflow-engine/types';

// Core extension interfaces
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
  
  // Lifecycle
  status: ExtensionStatus;
  loadedAt?: Date;
  unloadedAt?: Date;
  
  // Dependencies
  dependencies: ExtensionDependency[];
  peerDependencies: ExtensionDependency[];
  optionalDependencies: ExtensionDependency[];
  
  // Configuration
  configuration: ExtensionConfiguration;
  permissions: ExtensionPermission[];
  
  // Runtime
  instance?: any;
  context?: ExtensionContext;
  
  // Metadata
  metadata: ExtensionMetadata;
  manifest: ExtensionManifest;
}

export enum ExtensionType {
  // NestJS Modules
  NESTJS_MODULE = 'nestjs_module',
  
  // Workflow Extensions
  WORKFLOW_NODE = 'workflow_node',
  WORKFLOW_TRIGGER = 'workflow_trigger',
  WORKFLOW_VALIDATOR = 'workflow_validator',
  
  // Agent Extensions
  AGENT_CAPABILITY = 'agent_capability',
  AGENT_PROTOCOL = 'agent_protocol',
  AGENT_HANDOFF_TEMPLATE = 'agent_handoff_template',
  
  // Communication Extensions
  RELAY_TRANSPORT = 'relay_transport',
  MESSAGE_HANDLER = 'message_handler',
  
  // Integration Extensions
  API_INTEGRATION = 'api_integration',
  DATABASE_CONNECTOR = 'database_connector',
  AUTHENTICATION_PROVIDER = 'auth_provider',
  
  // UI Extensions
  VSCODE_EXTENSION = 'vscode_extension',
  CHROME_EXTENSION = 'chrome_extension',
  WEB_COMPONENT = 'web_component',
  
  // Development Extensions
  DEVELOPER_TOOL = 'developer_tool',
  DEBUG_PLUGIN = 'debug_plugin',
  TESTING_FRAMEWORK = 'testing_framework',
  
  // Analytics Extensions
  MONITORING_PLUGIN = 'monitoring_plugin',
  METRICS_COLLECTOR = 'metrics_collector',
  
  // Custom Extensions
  CUSTOM = 'custom'
}

export enum ExtensionCategory {
  CORE = 'core',
  WORKFLOW = 'workflow',
  AGENT = 'agent',
  COMMUNICATION = 'communication',
  INTEGRATION = 'integration',
  UI = 'ui',
  DEVELOPMENT = 'development',
  ANALYTICS = 'analytics',
  UTILITY = 'utility',
  EXPERIMENTAL = 'experimental'
}

export enum ExtensionStatus {
  UNLOADED = 'unloaded',
  LOADING = 'loading',
  LOADED = 'loaded',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  DISABLED = 'disabled',
  UNLOADING = 'unloading'
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
  schema?: any; // JSON Schema for configuration
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

export enum PermissionType {
  FILE_SYSTEM_READ = 'filesystem_read',
  FILE_SYSTEM_WRITE = 'filesystem_write',
  NETWORK_ACCESS = 'network_access',
  DATABASE_ACCESS = 'database_access',
  AGENT_CONTROL = 'agent_control',
  WORKFLOW_MODIFY = 'workflow_modify',
  SYSTEM_INFO = 'system_info',
  USER_DATA = 'user_data',
  SENSITIVE_DATA = 'sensitive_data',
  EXECUTION_CONTEXT = 'execution_context'
}

export interface ExtensionContext {
  extensionId: string;
  workingDirectory: string;
  configDirectory: string;
  logDirectory: string;
  tempDirectory: string;
  environment: 'development' | 'staging' | 'production';
  userId?: string;
  agentRegistry?: any;
  workflowEngine?: any;
  logger?: any;
  eventBus?: any;
}

export interface ExtensionMetadata {
  // Versioning
  apiVersion: string;
  frameworkVersion: string;
  
  // Build information
  buildTime?: Date;
  gitCommit?: string;
  buildNumber?: string;
  
  // Compatibility
  compatibility: {
    node: string;
    framework: string;
    platform: string[];
  };
  
  // Performance
  loadTime?: number;
  memoryUsage?: number;
  
  // Security
  checksum?: string;
  signature?: string;
  
  // Custom properties
  customProperties: Record<string, any>;
}

export interface ExtensionManifest {
  // Required fields
  name: string;
  version: string;
  main: string;
  
  // Optional fields
  description?: string;
  author?: string | ExtensionAuthor;
  license?: string;
  homepage?: string;
  repository?: string | ExtensionRepository;
  bugs?: string | { url: string; email?: string };
  
  // Extension-specific
  type: ExtensionType;
  category: ExtensionCategory;
  keywords: string[];
  
  // Entry points
  exports?: Record<string, string>;
  bin?: Record<string, string>;
  
  // Dependencies
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  
  // Configuration
  configuration?: any;
  permissions?: string[];
  
  // Lifecycle hooks
  hooks?: ExtensionHooks;
  
  // Assets
  assets?: string[];
  styles?: string[];
  scripts?: string[];
  
  // Platform-specific
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

// Extension lifecycle interfaces
export interface ExtensionLifecycle {
  onLoad?(context: ExtensionContext): Promise<void> | void;
  onUnload?(context: ExtensionContext): Promise<void> | void;
  onActivate?(context: ExtensionContext): Promise<void> | void;
  onDeactivate?(context: ExtensionContext): Promise<void> | void;
  onConfigChange?(config: Record<string, any>, context: ExtensionContext): Promise<void> | void;
  onError?(error: Error, context: ExtensionContext): Promise<void> | void;
}

// Extension validation interfaces
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

// Extension registry interfaces
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

// Extension loader interfaces
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

// Extension manager interfaces
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

// Specific extension type interfaces
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

// Extension discovery interfaces
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

// Extension event interfaces
export interface ExtensionEvent {
  type: ExtensionEventType;
  extensionId: string;
  timestamp: Date;
  data?: Record<string, any>;
}

export enum ExtensionEventType {
  EXTENSION_DISCOVERED = 'extension_discovered',
  EXTENSION_LOADED = 'extension_loaded',
  EXTENSION_UNLOADED = 'extension_unloaded',
  EXTENSION_ACTIVATED = 'extension_activated',
  EXTENSION_DEACTIVATED = 'extension_deactivated',
  EXTENSION_ERROR = 'extension_error',
  EXTENSION_CONFIG_CHANGED = 'extension_config_changed',
  DEPENDENCY_RESOLVED = 'dependency_resolved',
  DEPENDENCY_FAILED = 'dependency_failed'
}

// Extension API interfaces
export interface ExtensionAPI {
  // Registry operations
  getExtension(id: string): UnifiedExtension | null;
  getAllExtensions(): UnifiedExtension[];
  getExtensionsByType(type: ExtensionType): UnifiedExtension[];
  getExtensionsByCategory(category: ExtensionCategory): UnifiedExtension[];
  
  // Lifecycle operations
  loadExtension(path: string, options?: ExtensionLoadOptions): Promise<ExtensionLoadResult>;
  unloadExtension(id: string): Promise<boolean>;
  activateExtension(id: string): Promise<boolean>;
  deactivateExtension(id: string): Promise<boolean>;
  
  // Configuration
  getExtensionConfig(id: string): Record<string, any>;
  setExtensionConfig(id: string, config: Record<string, any>): Promise<boolean>;
  
  // Events
  onExtensionEvent(callback: (event: ExtensionEvent) => void): void;
  offExtensionEvent(callback: (event: ExtensionEvent) => void): void;
  
  // Discovery
  discoverExtensions(sources?: ExtensionDiscoverySource[]): Promise<ExtensionDiscoveryResult>;
  
  // Statistics
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

// Factory interfaces for creating extensions
export interface ExtensionFactory<T extends UnifiedExtension = UnifiedExtension> {
  create(manifest: ExtensionManifest, context: ExtensionContext): Promise<T>;
  validate(manifest: ExtensionManifest): ExtensionValidationResult;
  getType(): ExtensionType;
}

// Sandbox interfaces for secure extension execution
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

// Update and migration interfaces
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

// Export utility type guards
export function isNestJSModuleExtension(ext: UnifiedExtension): ext is NestJSModuleExtension {
  return ext.type === ExtensionType.NESTJS_MODULE;
}

export function isWorkflowNodeExtension(ext: UnifiedExtension): ext is WorkflowNodeExtension {
  return ext.type === ExtensionType.WORKFLOW_NODE;
}

export function isAgentCapabilityExtension(ext: UnifiedExtension): ext is AgentCapabilityExtension {
  return ext.type === ExtensionType.AGENT_CAPABILITY;
}

export function isVSCodeExtensionWrapper(ext: UnifiedExtension): ext is VSCodeExtensionWrapper {
  return ext.type === ExtensionType.VSCODE_EXTENSION;
}