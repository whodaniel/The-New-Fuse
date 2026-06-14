/**
 * Extension Validator - Comprehensive Extension Validation System
 *
 * Provides validation for extension manifests, configurations, permissions,
 * and runtime behavior to ensure security and compatibility
 */
import { Logger } from '@the-new-fuse/relay-core';
import { ExtensionManifest, ExtensionValidationResult } from '../types/ExtensionTypes.js';
export interface ExtensionValidatorConfig {
    strictMode: boolean;
    allowExperimentalFeatures: boolean;
    maxFileSize: number;
    maxFilesCount: number;
    allowedFileExtensions: string[];
    requiredFields: string[];
    securityChecks: boolean;
    performanceChecks: boolean;
    compatibilityChecks: boolean;
}
export interface SecurityScanResult {
    safe: boolean;
    issues: SecurityIssue[];
}
export interface SecurityIssue {
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: 'permission' | 'code' | 'dependency' | 'manifest';
    description: string;
    file?: string;
    line?: number;
    recommendation?: string;
}
export declare class ExtensionValidator {
    private logger;
    private config;
    private validationRules;
    private warningRules;
    constructor(logger: Logger, config?: Partial<ExtensionValidatorConfig>);
    /**
     * Validate extension manifest
     */
    validateManifest(manifest: ExtensionManifest, extensionPath?: string): Promise<ExtensionValidationResult>;
    /**
     * Validate extension configuration
     */
    validateConfiguration(manifest: ExtensionManifest, config: Record<string, any>): Promise<ExtensionValidationResult>;
    /**
     * Perform security scan
     */
    performSecurityScan(manifest: ExtensionManifest, extensionPath: string): Promise<SecurityScanResult>;
    /**
     * Initialize validation rules
     */
    private initializeValidationRules;
    /**
     * Initialize warning rules
     */
    private initializeWarningRules;
    /**
     * Security scan methods
     */
    private scanPermissions;
    private scanDependencies;
    private scanFiles;
    private scanManifest;
    /**
     * Type-specific configuration validators
     */
    private validateWorkflowNodeConfig;
    private validateAgentCapabilityConfig;
    /**
     * Helper methods
     */
    private validateAgainstSchema;
    private getDirectoryStats;
    private getAllFiles;
    private isSuspiciousUrl;
}
//# sourceMappingURL=ExtensionValidator.d.ts.map