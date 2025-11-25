/**
 * Extension Validator - Comprehensive Extension Validation System
 * 
 * Provides validation for extension manifests, configurations, permissions,
 * and runtime behavior to ensure security and compatibility
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as semver from 'semver';
import { Logger } from '@the-new-fuse/relay-core';
import {
  ExtensionManifest,
  ExtensionType,
  ExtensionCategory,
  ExtensionValidationResult,
  ExtensionValidationError,
  ExtensionValidationWarning,
  PermissionType
} from '../types/ExtensionTypes';

export interface ExtensionValidatorConfig {
  strictMode: boolean;
  allowExperimentalFeatures: boolean;
  maxFileSize: number; // bytes
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

export class ExtensionValidator {
  private logger: Logger;
  private config: ExtensionValidatorConfig;
  private validationRules: Map<string, (manifest: ExtensionManifest, extensionPath?: string) => Promise<ExtensionValidationError[]>>;
  private warningRules: Map<string, (manifest: ExtensionManifest, extensionPath?: string) => Promise<ExtensionValidationWarning[]>>;

  constructor(logger: Logger, config?: Partial<ExtensionValidatorConfig>) {
    this.logger = logger;
    this.config = {
      strictMode: false,
      allowExperimentalFeatures: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFilesCount: 1000,
      allowedFileExtensions: ['.js', '.ts', '.json', '.md', '.txt', '.css', '.html', '.svg', '.png', '.jpg'],
      requiredFields: ['name', 'version', 'main', 'type'],
      securityChecks: true,
      performanceChecks: true,
      compatibilityChecks: true,
      ...config
    };

    this.validationRules = new Map();
    this.warningRules = new Map();
    
    this.initializeValidationRules();
    this.initializeWarningRules();
  }

  /**
   * Validate extension manifest
   */
  async validateManifest(manifest: ExtensionManifest, extensionPath?: string): Promise<ExtensionValidationResult> {
    this.logger.debug(`🔍 Validating extension manifest: ${manifest.name}`);

    const errors: ExtensionValidationError[] = [];
    const warnings: ExtensionValidationWarning[] = [];

    try {
      // Run validation rules
      for (const [ruleName, rule] of this.validationRules.entries()) {
        try {
          const ruleErrors = await rule(manifest, extensionPath);
          errors.push(...ruleErrors);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.warn(`Validation rule ${ruleName} failed: ${errorMessage}`);
          errors.push({
            code: 'VALIDATION_RULE_ERROR',
            message: `Validation rule ${ruleName} failed: ${errorMessage}`,
            severity: 'error'
          });
        }
      }

      // Run warning rules
      for (const [ruleName, rule] of this.warningRules.entries()) {
        try {
          const ruleWarnings = await rule(manifest, extensionPath);
          warnings.push(...ruleWarnings);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.warn(`Warning rule ${ruleName} failed: ${errorMessage}`);
        }
      }

      // Additional validations
      if (extensionPath) {
        const securityResult = await this.performSecurityScan(manifest, extensionPath);
        errors.push(...securityResult.issues.filter(i => i.severity === 'critical' || i.severity === 'high').map(i => ({
          code: 'SECURITY_ISSUE',
          message: i.description,
          field: i.file,
          severity: 'error' as const
        })));
        warnings.push(...securityResult.issues.filter(i => i.severity === 'medium' || i.severity === 'low').map(i => ({
          code: 'SECURITY_WARNING',
          message: i.description,
          field: i.file,
          suggestion: i.recommendation
        })));
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Validation failed: ${errorMessage}`);
      errors.push({
        code: 'VALIDATION_FAILED',
        message: `Validation process failed: ${errorMessage}`,
        severity: 'error'
      });
    }

    const result: ExtensionValidationResult = {
      valid: errors.length === 0,
      errors,
      warnings
    };

    if (!result.valid) {
      this.logger.warn(`❌ Manifest validation failed: ${errors.length} errors, ${warnings.length} warnings`);
    } else {
      this.logger.debug(`✅ Manifest validation passed with ${warnings.length} warnings`);
    }

    return result;
  }

  /**
   * Validate extension configuration
   */
  async validateConfiguration(manifest: ExtensionManifest, config: Record<string, any>): Promise<ExtensionValidationResult> {
    const errors: ExtensionValidationError[] = [];
    const warnings: ExtensionValidationWarning[] = [];

    try {
      // Check if configuration schema exists
      if (manifest.configuration && typeof manifest.configuration === 'object') {
        const schema = manifest.configuration.schema || manifest.configuration;
        
        // Validate against schema if available
        if (schema) {
          const schemaValidation = await this.validateAgainstSchema(config, schema);
          errors.push(...schemaValidation.errors);
          warnings.push(...schemaValidation.warnings);
        }
      }

      // Type-specific configuration validation
      switch (manifest.type) {
        case ExtensionType.WORKFLOW_NODE:
          errors.push(...await this.validateWorkflowNodeConfig(config));
          break;
        case ExtensionType.AGENT_CAPABILITY:
          errors.push(...await this.validateAgentCapabilityConfig(config));
          break;
        // Add more type-specific validations...
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push({
        code: 'CONFIG_VALIDATION_ERROR',
        message: `Configuration validation failed: ${errorMessage}`,
        severity: 'error'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Perform security scan
   */
  async performSecurityScan(manifest: ExtensionManifest, extensionPath: string): Promise<SecurityScanResult> {
    if (!this.config.securityChecks) {
      return { safe: true, issues: [] };
    }

    const issues: SecurityIssue[] = [];

    try {
      // Check for dangerous permissions
      issues.push(...await this.scanPermissions(manifest));
      
      // Check dependencies
      issues.push(...await this.scanDependencies(manifest));
      
      // Check files
      issues.push(...await this.scanFiles(extensionPath));
      
      // Check manifest for suspicious entries
      issues.push(...await this.scanManifest(manifest));

    } catch {
      issues.push({
        severity: 'medium',
        type: 'manifest',
        description: `Security scan failed`
      });
    }

    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const safe = criticalIssues.length === 0;

    return { safe, issues };
  }

  /**
   * Initialize validation rules
   */
  private initializeValidationRules(): void {
    // Required fields validation
    this.validationRules.set('required_fields', async (manifest) => {
      const errors: ExtensionValidationError[] = [];
      
      for (const field of this.config.requiredFields) {
        if (!(field in manifest) || manifest[field as keyof ExtensionManifest] === undefined) {
          errors.push({
            code: 'MISSING_REQUIRED_FIELD',
            message: `Missing required field: ${field}`,
            field,
            severity: 'error'
          });
        }
      }
      
      return errors;
    });

    // Version format validation
    this.validationRules.set('version_format', async (manifest) => {
      const errors: ExtensionValidationError[] = [];
      
      if (!semver.valid(manifest.version)) {
        errors.push({
          code: 'INVALID_VERSION_FORMAT',
          message: `Invalid version format: ${manifest.version}. Must be valid semver.`,
          field: 'version',
          severity: 'error'
        });
      }
      
      return errors;
    });

    // Extension type validation
    this.validationRules.set('extension_type', async (manifest) => {
      const errors: ExtensionValidationError[] = [];
      
      if (!Object.values(ExtensionType).includes(manifest.type)) {
        errors.push({
          code: 'INVALID_EXTENSION_TYPE',
          message: `Invalid extension type: ${manifest.type}`,
          field: 'type',
          severity: 'error'
        });
      }
      
      return errors;
    });

    // Category validation
    this.validationRules.set('extension_category', async (manifest) => {
      const errors: ExtensionValidationError[] = [];
      
      if (!Object.values(ExtensionCategory).includes(manifest.category)) {
        errors.push({
          code: 'INVALID_EXTENSION_CATEGORY',
          message: `Invalid extension category: ${manifest.category}`,
          field: 'category',
          severity: 'error'
        });
      }
      
      return errors;
    });

    // Main file validation
    this.validationRules.set('main_file_exists', async (manifest, extensionPath) => {
      const errors: ExtensionValidationError[] = [];
      
      if (extensionPath) {
        const mainPath = path.join(extensionPath, manifest.main);
        if (!await fs.pathExists(mainPath)) {
          errors.push({
            code: 'MAIN_FILE_NOT_FOUND',
            message: `Main file not found: ${manifest.main}`,
            field: 'main',
            severity: 'error'
          });
        }
      }
      
      return errors;
    });

    // Dependencies validation
    this.validationRules.set('dependencies_format', async (manifest) => {
      const errors: ExtensionValidationError[] = [];
      
      const depFields = ['dependencies', 'peerDependencies', 'optionalDependencies'];
      
      for (const field of depFields) {
        const deps = manifest[field as keyof ExtensionManifest] as Record<string, string> | undefined;
        if (deps) {
          for (const [name, version] of Object.entries(deps)) {
            if (!semver.validRange(version)) {
              errors.push({
                code: 'INVALID_DEPENDENCY_VERSION',
                message: `Invalid version range for dependency ${name}: ${version}`,
                field,
                severity: 'error'
              });
            }
          }
        }
      }
      
      return errors;
    });

    // Platform compatibility
    this.validationRules.set('platform_compatibility', async (manifest) => {
      const errors: ExtensionValidationError[] = [];
      
      if (this.config.compatibilityChecks && manifest.platform) {
        if (manifest.platform.node && !semver.validRange(manifest.platform.node)) {
          errors.push({
            code: 'INVALID_NODE_VERSION',
            message: `Invalid Node.js version requirement: ${manifest.platform.node}`,
            field: 'platform.node',
            severity: 'error'
          });
        }
      }
      
      return errors;
    });

    // Permissions validation
    this.validationRules.set('permissions_format', async (manifest) => {
      const errors: ExtensionValidationError[] = [];
      
      if (manifest.permissions) {
        for (const permission of manifest.permissions) {
          if (!Object.values(PermissionType).includes(permission as PermissionType)) {
            errors.push({
              code: 'INVALID_PERMISSION',
              message: `Invalid permission: ${permission}`,
              field: 'permissions',
              severity: 'error'
            });
          }
        }
      }
      
      return errors;
    });
  }

  /**
   * Initialize warning rules
   */
  private initializeWarningRules(): void {
    // Missing description
    this.warningRules.set('missing_description', async (manifest) => {
      const warnings: ExtensionValidationWarning[] = [];
      
      if (!manifest.description || manifest.description.trim().length === 0) {
        warnings.push({
          code: 'MISSING_DESCRIPTION',
          message: 'Extension has no description',
          field: 'description',
          suggestion: 'Add a description to help users understand what this extension does'
        });
      }
      
      return warnings;
    });

    // Missing author
    this.warningRules.set('missing_author', async (manifest) => {
      const warnings: ExtensionValidationWarning[] = [];
      
      if (!manifest.author) {
        warnings.push({
          code: 'MISSING_AUTHOR',
          message: 'Extension has no author specified',
          field: 'author',
          suggestion: 'Specify the author to build trust with users'
        });
      }
      
      return warnings;
    });

    // Missing keywords
    this.warningRules.set('missing_keywords', async (manifest) => {
      const warnings: ExtensionValidationWarning[] = [];
      
      if (!manifest.keywords || manifest.keywords.length === 0) {
        warnings.push({
          code: 'MISSING_KEYWORDS',
          message: 'Extension has no keywords',
          field: 'keywords',
          suggestion: 'Add keywords to improve discoverability'
        });
      }
      
      return warnings;
    });

    // Dangerous permissions
    this.warningRules.set('dangerous_permissions', async (manifest) => {
      const warnings: ExtensionValidationWarning[] = [];
      
      const dangerousPermissions = [
        PermissionType.FILE_SYSTEM_WRITE,
        PermissionType.SYSTEM_INFO,
        PermissionType.SENSITIVE_DATA
      ];
      
      if (manifest.permissions) {
        const requestedDangerous = manifest.permissions.filter(p => 
          dangerousPermissions.includes(p as PermissionType)
        );
        
        if (requestedDangerous.length > 0) {
          warnings.push({
            code: 'DANGEROUS_PERMISSIONS',
            message: `Extension requests potentially dangerous permissions: ${requestedDangerous.join(', ')}`,
            field: 'permissions',
            suggestion: 'Ensure these permissions are necessary and document why they are needed'
          });
        }
      }
      
      return warnings;
    });

    // Large bundle size warning
    this.warningRules.set('large_bundle', async (manifest, extensionPath) => {
      const warnings: ExtensionValidationWarning[] = [];
      
      if (extensionPath && this.config.performanceChecks) {
        try {
          const stats = await this.getDirectoryStats(extensionPath);
          
          if (stats.totalSize > this.config.maxFileSize) {
            warnings.push({
              code: 'LARGE_BUNDLE_SIZE',
              message: `Extension bundle is large: ${(stats.totalSize / 1024 / 1024).toFixed(2)}MB`,
              suggestion: 'Consider optimizing bundle size for better performance'
            });
          }
          
          if (stats.fileCount > this.config.maxFilesCount) {
            warnings.push({
              code: 'TOO_MANY_FILES',
              message: `Extension contains many files: ${stats.fileCount}`,
              suggestion: 'Consider bundling or reducing the number of files'
            });
          }
        } catch {
          // Ignore errors in warning rules
        }
      }
      
      return warnings;
    });
  }

  /**
   * Security scan methods
   */
  private async scanPermissions(manifest: ExtensionManifest): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    
    if (!manifest.permissions) {
      return issues;
    }

    const criticalPermissions = [
      PermissionType.FILE_SYSTEM_WRITE,
      PermissionType.SYSTEM_INFO,
      PermissionType.SENSITIVE_DATA
    ];

    for (const permission of manifest.permissions) {
      if (criticalPermissions.includes(permission as PermissionType)) {
        issues.push({
          severity: 'high',
          type: 'permission',
          description: `Extension requests critical permission: ${permission}`,
          recommendation: 'Verify this permission is necessary and the extension is from a trusted source'
        });
      }
    }

    return issues;
  }

  private async scanDependencies(manifest: ExtensionManifest): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    
    // Check for known vulnerable packages (simplified check)
    const knownVulnerable = ['lodash@4.17.15', 'axios@0.19.0']; // Example
    
    const allDeps = {
      ...manifest.dependencies,
      ...manifest.peerDependencies,
      ...manifest.optionalDependencies
    };

    for (const [name, version] of Object.entries(allDeps || {})) {
      const depString = `${name}@${version}`;
      
      if (knownVulnerable.includes(depString)) {
        issues.push({
          severity: 'high',
          type: 'dependency',
          description: `Dependency ${depString} has known vulnerabilities`,
          recommendation: 'Update to a secure version'
        });
      }
    }

    return issues;
  }

  private async scanFiles(extensionPath: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    
    try {
      const files = await this.getAllFiles(extensionPath);
      
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        
        // Check for disallowed file types
        if (!this.config.allowedFileExtensions.includes(ext)) {
          issues.push({
            severity: 'medium',
            type: 'code',
            description: `Potentially unsafe file type: ${ext}`,
            file: file,
            recommendation: 'Remove or verify the need for this file type'
          });
        }
        
        // Check for executable files
        if (['.exe', '.bat', '.sh', '.cmd'].includes(ext)) {
          issues.push({
            severity: 'critical',
            type: 'code',
            description: `Executable file detected: ${file}`,
            file: file,
            recommendation: 'Remove executable files or verify their purpose'
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      issues.push({
        severity: 'medium',
        type: 'code',
        description: `Failed to scan files: ${errorMessage}`
      });
    }

    return issues;
  }

  private async scanManifest(manifest: ExtensionManifest): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    
    // Check for suspicious URLs
    const urls = [manifest.homepage, manifest.repository];
    for (const url of urls) {
      if (url && typeof url === 'string') {
        if (this.isSuspiciousUrl(url)) {
          issues.push({
            severity: 'medium',
            type: 'manifest',
            description: `Suspicious URL detected: ${url}`,
            recommendation: 'Verify the URL is legitimate'
          });
        }
      }
    }

    return issues;
  }

  /**
   * Type-specific configuration validators
   */
  private async validateWorkflowNodeConfig(config: Record<string, any>): Promise<ExtensionValidationError[]> {
    const errors: ExtensionValidationError[] = [];
    
    // Add workflow node specific validation
    if (!config.nodeType || typeof config.nodeType !== 'string') {
      errors.push({
        code: 'MISSING_NODE_TYPE',
        message: 'Workflow node extension must specify nodeType',
        field: 'nodeType',
        severity: 'error'
      });
    }
    
    return errors;
  }

  private async validateAgentCapabilityConfig(config: Record<string, any>): Promise<ExtensionValidationError[]> {
    const errors: ExtensionValidationError[] = [];
    
    // Add agent capability specific validation
    if (!config.capabilityName || typeof config.capabilityName !== 'string') {
      errors.push({
        code: 'MISSING_CAPABILITY_NAME',
        message: 'Agent capability extension must specify capabilityName',
        field: 'capabilityName',
        severity: 'error'
      });
    }
    
    return errors;
  }

  /**
   * Helper methods
   */
  private async validateAgainstSchema(data: any, schema: any): Promise<{ errors: ExtensionValidationError[]; warnings: ExtensionValidationWarning[] }> {
    // Simplified schema validation
    // In a real implementation, this would use a proper JSON Schema validator
    const errors: ExtensionValidationError[] = [];
    const warnings: ExtensionValidationWarning[] = [];
    
    // Basic type checking
    if (schema.type && typeof data !== schema.type) {
      errors.push({
        code: 'SCHEMA_TYPE_MISMATCH',
        message: `Expected ${schema.type}, got ${typeof data}`,
        severity: 'error'
      });
    }
    
    return { errors, warnings };
  }

  private async getDirectoryStats(dirPath: string): Promise<{ totalSize: number; fileCount: number }> {
    let totalSize = 0;
    let fileCount = 0;
    
    const files = await this.getAllFiles(dirPath);
    
    for (const file of files) {
      try {
        const stats = await fs.stat(file);
        totalSize += stats.size;
        fileCount++;
      } catch {
        // Ignore errors for individual files
      }
    }
    
    return { totalSize, fileCount };
  }

  private async getAllFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    
    async function scan(currentPath: string): Promise<void> {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    }
    
    await scan(dirPath);
    return files;
  }

  private isSuspiciousUrl(url: string): boolean {
    // Simple suspicious URL detection
    const suspiciousPatterns = [
      /bit\.ly/,
      /tinyurl/,
      /\d+\.\d+\.\d+\.\d+/, // IP addresses
      /localhost/,
      /127\.0\.0\.1/
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(url));
  }
}