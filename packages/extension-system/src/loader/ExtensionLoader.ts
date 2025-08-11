/**
 * Extension Loader - Dynamic Extension Loading and Management
 * 
 * Handles the loading, validation, and instantiation of extensions from various sources
 * Provides secure sandboxing and dependency resolution
 */

import { EventEmitter } from 'events';
import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';
import { Logger } from '@tnf/relay-core';
import {
  UnifiedExtension,
  ExtensionManifest,
  ExtensionType,
  ExtensionStatus,
  ExtensionContext,
  ExtensionLoadOptions,
  ExtensionLoadResult,
  ExtensionValidationResult,
  ExtensionLifecycle,
  ExtensionFactory,
  ExtensionSandbox,
  ExtensionEvent,
  ExtensionEventType,
  ExtensionPermission,
  PermissionType
} from '../types/ExtensionTypes.js';

export interface ExtensionLoaderConfig {
  extensionDirectories: string[];
  configDirectory: string;
  logDirectory: string;
  tempDirectory: string;
  enableSandboxing: boolean;
  maxLoadTime: number;
  maxMemoryUsage: number;
  allowUnsignedExtensions: boolean;
  trustedSources: string[];
  permissionModel: 'strict' | 'permissive' | 'interactive';
}

export class ExtensionLoader extends EventEmitter {
  private logger: Logger;
  private config: ExtensionLoaderConfig;
  private loadedExtensions: Map<string, UnifiedExtension> = new Map();
  private extensionFactories: Map<ExtensionType, ExtensionFactory> = new Map();
  private sandboxes: Map<string, ExtensionSandbox> = new Map();
  private loadingPromises: Map<string, Promise<ExtensionLoadResult>> = new Map();

    constructor(config: ExtensionLoaderConfig, logger: Logger) {
    super();
    this.config = config;
    this.logger = logger;
    
    this.initializeExtensionFactories();
  }

  /**
   * Load extension from path
   */
  async loadExtension(extensionPath: string, options: ExtensionLoadOptions = {}): Promise<ExtensionLoadResult> {
    const startTime = Date.now();
    
    try {
      this.logger.info(`🔌 Loading extension from: ${extensionPath}`);
      
      // Check if already loading
      if (this.loadingPromises.has(extensionPath)) {
        return await this.loadingPromises.get(extensionPath)!;
      }

      // Create loading promise
      const loadingPromise = this.performLoad(extensionPath, options, startTime);
      this.loadingPromises.set(extensionPath, loadingPromise);
      
      const result = await loadingPromise;
      this.loadingPromises.delete(extensionPath);
      
      return result;
      
    } catch (error) {
      this.loadingPromises.delete(extensionPath);
      const loadTime = Date.now() - startTime;
      
      this.logger.error(`❌ Failed to load extension: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        error: error as Error,
        warnings: [],
        loadTime
      };
    }
  }

  /**
   * Perform the actual extension loading
   */
  private async performLoad(
    extensionPath: string,
    options: ExtensionLoadOptions,
    startTime: number
  ): Promise<ExtensionLoadResult> {
    const warnings: string[] = [];
    
    // 1. Load and validate manifest
    const manifest = await this.loadManifest(extensionPath);
    if (!manifest) {
      throw new Error('No valid manifest found');
    }

    // 2. Check if already loaded
    if (this.loadedExtensions.has(manifest.name) && !options.force) {
      const existing = this.loadedExtensions.get(manifest.name)!;
      return {
        success: true,
        extension: existing,
        warnings: ['Extension already loaded'],
        loadTime: Date.now() - startTime
      };
    }

    // 3. Validate extension
    if (!options.skipValidation) {
      const validation = await this.validateExtension(manifest, extensionPath);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }
      warnings.push(...validation.warnings.map(w => w.message));
    }

    // 4. Create extension context
    const context = await this.createExtensionContext(manifest, extensionPath);

    // 5. Resolve dependencies
    if (!options.skipDependencies) {
      await this.resolveDependencies(manifest, context);
    }

    // 6. Request permissions
    const permissions = await this.requestPermissions(manifest, options);

    // 7. Create extension instance
    const extension = await this.createExtensionInstance(manifest, context, extensionPath, permissions);

    // 8. Initialize sandbox if enabled
    if (this.config.enableSandboxing) {
      const sandbox = await this.createSandbox(extension, context);
      this.sandboxes.set(extension.id, sandbox);
    }

    // 9. Load the extension
    await this.initializeExtension(extension, context);

    // 10. Register extension
    this.loadedExtensions.set(extension.id, extension);
    extension.status = ExtensionStatus.LOADED;
    extension.loadedAt = new Date();

    const loadTime = Date.now() - startTime;
    this.logger.info(`✅ Extension loaded: ${extension.name} (${loadTime}ms)`);

    // Emit event
    this.emitExtensionEvent({
      type: ExtensionEventType.EXTENSION_LOADED,
      extensionId: extension.id,
      timestamp: new Date(),
      data: { loadTime, warnings }
    });

    return {
      success: true,
      extension,
      warnings,
      loadTime
    };
  }

  /**
   * Load extension manifest
   */
  private async loadManifest(extensionPath: string): Promise<ExtensionManifest | null> {
    const possibleManifests = [
      'extension.json',
      'manifest.json',
      'package.json'
    ];

    for (const manifestFile of possibleManifests) {
      const manifestPath = path.join(extensionPath, manifestFile);
      
      if (await fs.pathExists(manifestPath)) {
        try {
          const content = await fs.readJson(manifestPath);
          
          // Handle package.json format
          if (manifestFile === 'package.json') {
            return this.convertPackageJsonToManifest(content);
          }
          
          return content as ExtensionManifest;
        } catch (error) {
          this.logger.warn(`Failed to load manifest ${manifestPath}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    return null;
  }

  /**
   * Convert package.json to extension manifest
   */
  private convertPackageJsonToManifest(packageJson: any): ExtensionManifest {
    return {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      author: packageJson.author,
      license: packageJson.license,
      homepage: packageJson.homepage,
      repository: packageJson.repository,
      main: packageJson.main || 'index.js',
      type: packageJson.extensionType || ExtensionType.CUSTOM,
      category: packageJson.extensionCategory || 'utility',
      keywords: packageJson.keywords || [],
      dependencies: packageJson.dependencies,
      peerDependencies: packageJson.peerDependencies,
      optionalDependencies: packageJson.optionalDependencies,
      configuration: packageJson.extensionConfig,
      permissions: packageJson.extensionPermissions,
      hooks: packageJson.extensionHooks,
      platform: packageJson.engines
    };
  }

  /**
   * Validate extension
   */
  private async validateExtension(
    manifest: ExtensionManifest,
    extensionPath: string
  ): Promise<ExtensionValidationResult> {
    const factory = this.extensionFactories.get(manifest.type);
    if (!factory) {
      return {
        valid: false,
        errors: [{
          code: 'UNSUPPORTED_TYPE',
          message: `Unsupported extension type: ${manifest.type}`,
          severity: 'error'
        }],
        warnings: []
      };
    }

    // Validate with factory
    const factoryValidation = factory.validate(manifest);
    
    // Additional validations
    const errors = [...factoryValidation.errors];
    const warnings = [...factoryValidation.warnings];

    // Check main file exists
    const mainPath = path.join(extensionPath, manifest.main);
    if (!await fs.pathExists(mainPath)) {
      errors.push({
        code: 'MISSING_MAIN_FILE',
        message: `Main file not found: ${manifest.main}`,
        field: 'main',
        severity: 'error'
      });
    }

    // Check version format
    if (!this.isValidVersion(manifest.version)) {
      errors.push({
        code: 'INVALID_VERSION',
        message: `Invalid version format: ${manifest.version}`,
        field: 'version',
        severity: 'error'
      });
    }

    // Check for dangerous permissions
    const dangerousPermissions = manifest.permissions?.filter(p => 
      [PermissionType.FILE_SYSTEM_WRITE, PermissionType.SYSTEM_INFO].includes(p as PermissionType)
    );
    if (dangerousPermissions && dangerousPermissions.length > 0) {
      warnings.push({
        code: 'DANGEROUS_PERMISSIONS',
        message: `Extension requests dangerous permissions: ${dangerousPermissions.join(', ')}`,
        suggestion: 'Review permissions carefully before granting'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Create extension context
   */
  private async createExtensionContext(
    manifest: ExtensionManifest,
    extensionPath: string
  ): Promise<ExtensionContext> {
    const extensionId = `${manifest.name}@${manifest.version}`;
    
    // Create directories
    const configDir = path.join(this.config.configDirectory, manifest.name);
    const logDir = path.join(this.config.logDirectory, manifest.name);
    const tempDir = path.join(this.config.tempDirectory, manifest.name);
    
    await Promise.all([
      fs.ensureDir(configDir),
      fs.ensureDir(logDir),
      fs.ensureDir(tempDir)
    ]);

    return {
      extensionId,
      workingDirectory: extensionPath,
      configDirectory: configDir,
      logDirectory: logDir,
      tempDirectory: tempDir,
      environment: process.env.NODE_ENV as any || 'development',
      logger: (this.logger as any).child({ extension: manifest.name })
    };
  }

  /**
   * Resolve extension dependencies
   */
  private async resolveDependencies(manifest: ExtensionManifest, context: ExtensionContext): Promise<void> {
    const dependencies = [
      ...(manifest.dependencies ? Object.entries(manifest.dependencies) : []),
      ...(manifest.peerDependencies ? Object.entries(manifest.peerDependencies) : [])
    ];

    for (const [name, version] of dependencies) {
      try {
        // Check if it's an extension dependency
        if (name.startsWith('@the-new-fuse/')) {
          const dependencyExtension = this.loadedExtensions.get(name);
          if (!dependencyExtension) {
            throw new Error(`Required extension dependency not loaded: ${name}`);
          }
          continue;
        }

        // Check if it's an npm dependency
        try {
          require.resolve(name, { paths: [context.workingDirectory] });
        } catch {
          this.logger.warn(`Dependency ${name}@${version} not found, attempting to install...`);
          // In a real implementation, this might trigger npm install
        }
      } catch (error) {
        throw new Error(`Failed to resolve dependency ${name}@${version}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Request permissions for extension
   */
  private async requestPermissions(
    manifest: ExtensionManifest,
    options: ExtensionLoadOptions
  ): Promise<ExtensionPermission[]> {
    const permissions: ExtensionPermission[] = [];
    
    if (!manifest.permissions) {
      return permissions;
    }

    for (const permissionName of manifest.permissions) {
      const permission: ExtensionPermission = {
        name: permissionName,
        description: this.getPermissionDescription(permissionName as PermissionType),
        type: permissionName as PermissionType,
        granted: false,
        required: true,
        requestedAt: new Date()
      };

      // Auto-grant based on permission model or overrides
      if (options.permissionOverrides?.[permissionName] !== undefined) {
        permission.granted = options.permissionOverrides[permissionName];
      } else {
        permission.granted = this.shouldAutoGrantPermission(
          permissionName as PermissionType,
          manifest
        );
      }

      if (permission.granted) {
        permission.grantedAt = new Date();
      }

      permissions.push(permission);
    }

    return permissions;
  }

  /**
   * Create extension instance
   */
  private async createExtensionInstance(
    manifest: ExtensionManifest,
    context: ExtensionContext,
    extensionPath: string,
    permissions: ExtensionPermission[]
  ): Promise<UnifiedExtension> {
    const factory = this.extensionFactories.get(manifest.type);
    if (!factory) {
      throw new Error(`No factory found for extension type: ${manifest.type}`);
    }

    const extension = await factory.create(manifest, context);
    
    // Set additional properties
    extension.permissions = permissions;
    extension.status = ExtensionStatus.LOADING;
    
    return extension;
  }

  /**
   * Create sandbox for extension
   */
  private async createSandbox(
    extension: UnifiedExtension,
    _context: ExtensionContext
  ): Promise<ExtensionSandbox> {
    // Simplified sandbox implementation
    // In a real implementation, this would create proper isolation
    return {
      id: `sandbox_${extension.id}`,
      extensionId: extension.id,
      environment: 'node',
      permissions: extension.permissions,
      resourceLimits: {
        memory: this.config.maxMemoryUsage,
        cpu: 80, // 80% CPU limit
        time: this.config.maxLoadTime,
        network: this.hasPermission(extension, PermissionType.NETWORK_ACCESS),
        filesystem: this.hasPermission(extension, PermissionType.FILE_SYSTEM_READ)
      },
      async execute<T = any>(code: string, args?: any[]): Promise<T> {
        // Simplified execution - in real implementation would use vm or worker_threads
        const func = new Function('...args', code);
        return func(...(args || []));
      },
      async cleanup(): Promise<void> {
        // Cleanup sandbox resources
      }
    };
  }

  /**
   * Initialize extension
   */
  private async initializeExtension(extension: UnifiedExtension, context: ExtensionContext): Promise<void> {
    try {
      // Load the main module
      const mainPath = path.resolve(context.workingDirectory, extension.manifest.main);
      const extensionModule = require(mainPath);
      
      // Store instance
      extension.instance = extensionModule.default || extensionModule;
      
      // Call lifecycle hook
      if (this.implementsLifecycle(extension.instance)) {
        await extension.instance.onLoad?.(context);
      }
      
    } catch (error) {
      throw new Error(`Failed to initialize extension: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Unload extension
   */
  async unloadExtension(extensionId: string): Promise<boolean> {
    const extension = this.loadedExtensions.get(extensionId);
    if (!extension) {
      return false;
    }

    try {
      this.logger.info(`🔌 Unloading extension: ${extension.name}`);
      
      extension.status = ExtensionStatus.UNLOADING;

      // Call lifecycle hook
      if (this.implementsLifecycle(extension.instance)) {
        await extension.instance.onUnload?.(extension.context!);
      }

      // Cleanup sandbox
      const sandbox = this.sandboxes.get(extensionId);
      if (sandbox) {
        await sandbox.cleanup();
        this.sandboxes.delete(extensionId);
      }

      // Remove from registry
      this.loadedExtensions.delete(extensionId);
      extension.status = ExtensionStatus.UNLOADED;
      extension.unloadedAt = new Date();

      // Emit event
      this.emitExtensionEvent({
        type: ExtensionEventType.EXTENSION_UNLOADED,
        extensionId,
        timestamp: new Date()
      });

      this.logger.info(`✅ Extension unloaded: ${extension.name}`);
      return true;
      
    } catch (error) {
      extension.status = ExtensionStatus.ERROR;
      this.logger.error(`❌ Failed to unload extension: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Discover extensions in directories
   */
  async discoverExtensions(): Promise<ExtensionManifest[]> {
    const manifests: ExtensionManifest[] = [];
    
    for (const directory of this.config.extensionDirectories) {
      try {
        if (!await fs.pathExists(directory)) {
          continue;
        }

        // Look for extension directories
        const patterns = [
          path.join(directory, '*/extension.json'),
          path.join(directory, '*/manifest.json'),
          path.join(directory, '*/package.json')
        ];

        for (const pattern of patterns) {
          const files = await glob(pattern);
          
          for (const file of files) {
            try {
              const manifest = await this.loadManifest(path.dirname(file));
              if (manifest) {
                manifests.push(manifest);
              }
            } catch (error) {
              this.logger.warn(`Failed to load manifest from ${file}: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
        }
      } catch (error) {
        this.logger.error(`Error discovering extensions in ${directory}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return manifests;
  }

  /**
   * Initialize extension factories
   */
  private initializeExtensionFactories(): void {
    // Initialize built-in factories
    // In a real implementation, these would be separate factory classes
    
    this.extensionFactories.set(ExtensionType.NESTJS_MODULE, {
      async create(manifest, context) {
        return {
          id: `${manifest.name}@${manifest.version}`,
          name: manifest.name,
          version: manifest.version,
          type: manifest.type,
          author: manifest.author as string || 'Unknown',
          keywords: manifest.keywords,
          category: manifest.category,
          status: ExtensionStatus.UNLOADED,
          dependencies: [],
          peerDependencies: [],
          optionalDependencies: [],
          configuration: {
            defaults: {},
            current: {},
            userOverrides: {},
            environmentOverrides: {}
          },
          permissions: [],
          context,
          metadata: {
            apiVersion: '1.0.0',
            frameworkVersion: '1.0.0',
            compatibility: {
              node: '>= 18.0.0',
              framework: '^1.0.0',
              platform: ['node']
            },
            customProperties: {}
          },
          manifest
        };
      },
      validate(manifest) {
        const errors = [];
        const warnings: Array<{code: string; message: string; field: string; severity: 'warning'}> = [];
        
        if (!manifest.main) {
          errors.push({
            code: 'MISSING_MAIN',
            message: 'Main file is required',
            field: 'main',
            severity: 'error' as const
          });
        }
        
        return { valid: errors.length === 0, errors, warnings };
      },
      getType() {
        return ExtensionType.NESTJS_MODULE;
      }
    });

    // Add more factories for other extension types...
  }

  /**
   * Helper methods
   */
  private isValidVersion(version: string): boolean {
    return /^\d+\.\d+\.\d+/.test(version);
  }

  private getPermissionDescription(permission: PermissionType): string {
    const descriptions: Record<PermissionType, string> = {
      [PermissionType.FILE_SYSTEM_READ]: 'Read files from the filesystem',
      [PermissionType.FILE_SYSTEM_WRITE]: 'Write files to the filesystem',
      [PermissionType.NETWORK_ACCESS]: 'Make network requests',
      [PermissionType.DATABASE_ACCESS]: 'Access the database',
      [PermissionType.AGENT_CONTROL]: 'Control and interact with agents',
      [PermissionType.WORKFLOW_MODIFY]: 'Modify workflows',
      [PermissionType.SYSTEM_INFO]: 'Access system information',
      [PermissionType.USER_DATA]: 'Access user data',
      [PermissionType.SENSITIVE_DATA]: 'Access sensitive data',
      [PermissionType.EXECUTION_CONTEXT]: 'Access execution context'
    };
    
    return descriptions[permission] || 'Unknown permission';
  }

  private shouldAutoGrantPermission(_permission: PermissionType, _manifest: ExtensionManifest): boolean {
    // Implement permission granting logic based on config
    switch (this.config.permissionModel) {
      case 'strict':
        return false;
      case 'permissive':
        return true;
      case 'interactive':
        // Would show UI prompt in real implementation
        return false;
      default:
        return false;
    }
  }

  private hasPermission(extension: UnifiedExtension, permission: PermissionType): boolean {
    return extension.permissions.some(p => p.type === permission && p.granted);
  }

  private implementsLifecycle(instance: any): instance is ExtensionLifecycle {
    return instance && (
      typeof instance.onLoad === 'function' ||
      typeof instance.onUnload === 'function' ||
      typeof instance.onActivate === 'function' ||
      typeof instance.onDeactivate === 'function'
    );
  }

  private emitExtensionEvent(event: ExtensionEvent): void {
    this.emit('extensionEvent', event);
  }

  /**
   * Public API
   */
  getLoadedExtensions(): UnifiedExtension[] {
    return Array.from(this.loadedExtensions.values());
  }

  getExtension(id: string): UnifiedExtension | null {
    return this.loadedExtensions.get(id) || null;
  }

  isLoaded(id: string): boolean {
    return this.loadedExtensions.has(id);
  }

  async loadFromDirectory(_directory: string): Promise<ExtensionLoadResult[]> {
    const manifests = await this.discoverExtensions();
    const results: ExtensionLoadResult[] = [];
    
    for (const manifest of manifests) {
      const extensionPath = path.dirname(manifest.main);
      const result = await this.loadExtension(extensionPath);
      results.push(result);
    }
    
    return results;
  }
}