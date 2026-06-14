"use strict";
/**
 * Extension Validator - Comprehensive Extension Validation System
 *
 * Provides validation for extension manifests, configurations, permissions,
 * and runtime behavior to ensure security and compatibility
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionValidator = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const semver = __importStar(require("semver"));
const ExtensionTypes_js_1 = require("../types/ExtensionTypes.js");
class ExtensionValidator {
    constructor(logger, config) {
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
    async validateManifest(manifest, extensionPath) {
        this.logger.debug(`🔍 Validating extension manifest: ${manifest.name}`);
        const errors = [];
        const warnings = [];
        try {
            // Run validation rules
            for (const [ruleName, rule] of this.validationRules.entries()) {
                try {
                    const ruleErrors = await rule(manifest, extensionPath);
                    errors.push(...ruleErrors);
                }
                catch (error) {
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
                }
                catch (error) {
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
                    severity: 'error'
                })));
                warnings.push(...securityResult.issues.filter(i => i.severity === 'medium' || i.severity === 'low').map(i => ({
                    code: 'SECURITY_WARNING',
                    message: i.description,
                    field: i.file,
                    suggestion: i.recommendation
                })));
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Validation failed: ${errorMessage}`);
            errors.push({
                code: 'VALIDATION_FAILED',
                message: `Validation process failed: ${errorMessage}`,
                severity: 'error'
            });
        }
        const result = {
            valid: errors.length === 0,
            errors,
            warnings
        };
        if (!result.valid) {
            this.logger.warn(`❌ Manifest validation failed: ${errors.length} errors, ${warnings.length} warnings`);
        }
        else {
            this.logger.debug(`✅ Manifest validation passed with ${warnings.length} warnings`);
        }
        return result;
    }
    /**
     * Validate extension configuration
     */
    async validateConfiguration(manifest, config) {
        const errors = [];
        const warnings = [];
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
                case ExtensionTypes_js_1.ExtensionType.WORKFLOW_NODE:
                    errors.push(...await this.validateWorkflowNodeConfig(config));
                    break;
                case ExtensionTypes_js_1.ExtensionType.AGENT_CAPABILITY:
                    errors.push(...await this.validateAgentCapabilityConfig(config));
                    break;
                // Add more type-specific validations...
            }
        }
        catch (error) {
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
    async performSecurityScan(manifest, extensionPath) {
        if (!this.config.securityChecks) {
            return { safe: true, issues: [] };
        }
        const issues = [];
        try {
            // Check for dangerous permissions
            issues.push(...await this.scanPermissions(manifest));
            // Check dependencies
            issues.push(...await this.scanDependencies(manifest));
            // Check files
            issues.push(...await this.scanFiles(extensionPath));
            // Check manifest for suspicious entries
            issues.push(...await this.scanManifest(manifest));
        }
        catch {
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
    initializeValidationRules() {
        // Required fields validation
        this.validationRules.set('required_fields', async (manifest) => {
            const errors = [];
            for (const field of this.config.requiredFields) {
                if (!(field in manifest) || manifest[field] === undefined) {
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
            const errors = [];
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
            const errors = [];
            if (!Object.values(ExtensionTypes_js_1.ExtensionType).includes(manifest.type)) {
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
            const errors = [];
            if (!Object.values(ExtensionTypes_js_1.ExtensionCategory).includes(manifest.category)) {
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
            const errors = [];
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
            const errors = [];
            const depFields = ['dependencies', 'peerDependencies', 'optionalDependencies'];
            for (const field of depFields) {
                const deps = manifest[field];
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
            const errors = [];
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
            const errors = [];
            if (manifest.permissions) {
                for (const permission of manifest.permissions) {
                    if (!Object.values(ExtensionTypes_js_1.PermissionType).includes(permission)) {
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
    initializeWarningRules() {
        // Missing description
        this.warningRules.set('missing_description', async (manifest) => {
            const warnings = [];
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
            const warnings = [];
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
            const warnings = [];
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
            const warnings = [];
            const dangerousPermissions = [
                ExtensionTypes_js_1.PermissionType.FILE_SYSTEM_WRITE,
                ExtensionTypes_js_1.PermissionType.SYSTEM_INFO,
                ExtensionTypes_js_1.PermissionType.SENSITIVE_DATA
            ];
            if (manifest.permissions) {
                const requestedDangerous = manifest.permissions.filter(p => dangerousPermissions.includes(p));
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
            const warnings = [];
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
                }
                catch {
                    // Ignore errors in warning rules
                }
            }
            return warnings;
        });
    }
    /**
     * Security scan methods
     */
    async scanPermissions(manifest) {
        const issues = [];
        if (!manifest.permissions) {
            return issues;
        }
        const criticalPermissions = [
            ExtensionTypes_js_1.PermissionType.FILE_SYSTEM_WRITE,
            ExtensionTypes_js_1.PermissionType.SYSTEM_INFO,
            ExtensionTypes_js_1.PermissionType.SENSITIVE_DATA
        ];
        for (const permission of manifest.permissions) {
            if (criticalPermissions.includes(permission)) {
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
    async scanDependencies(manifest) {
        const issues = [];
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
    async scanFiles(extensionPath) {
        const issues = [];
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            issues.push({
                severity: 'medium',
                type: 'code',
                description: `Failed to scan files: ${errorMessage}`
            });
        }
        return issues;
    }
    async scanManifest(manifest) {
        const issues = [];
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
    async validateWorkflowNodeConfig(config) {
        const errors = [];
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
    async validateAgentCapabilityConfig(config) {
        const errors = [];
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
    async validateAgainstSchema(data, schema) {
        // Simplified schema validation
        // In a real implementation, this would use a proper JSON Schema validator
        const errors = [];
        const warnings = [];
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
    async getDirectoryStats(dirPath) {
        let totalSize = 0;
        let fileCount = 0;
        const files = await this.getAllFiles(dirPath);
        for (const file of files) {
            try {
                const stats = await fs.stat(file);
                totalSize += stats.size;
                fileCount++;
            }
            catch {
                // Ignore errors for individual files
            }
        }
        return { totalSize, fileCount };
    }
    async getAllFiles(dirPath) {
        const files = [];
        async function scan(currentPath) {
            const entries = await fs.readdir(currentPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name);
                if (entry.isDirectory()) {
                    await scan(fullPath);
                }
                else {
                    files.push(fullPath);
                }
            }
        }
        await scan(dirPath);
        return files;
    }
    isSuspiciousUrl(url) {
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
exports.ExtensionValidator = ExtensionValidator;
//# sourceMappingURL=ExtensionValidator.js.map