/**
 * Extension Manager - The New Fuse
 *
 * The central class for managing the lifecycle of extensions.
 * It orchestrates the loading, enabling, disabling, and unloading of extensions.
 */

import { EventEmitter } from 'events';
import { Logger, LogLevel } from '@the-new-fuse/relay-core';
import { ExtensionRegistry } from './ExtensionRegistry.js';
import { ExtensionLoader } from './ExtensionLoader.js';
import { ExtensionValidator } from './ExtensionValidator.js';
import { Extension, ExtensionStatus } from './ExtensionTypes.js';

export class ExtensionManager extends EventEmitter {
  private logger: Logger;
  private registry: ExtensionRegistry;
  private loader: ExtensionLoader;
  private validator: ExtensionValidator;

  constructor(logLevel: LogLevel, workspaceDir: string, extensionPaths: string[]) {
    super();
    this.logger = new Logger(logLevel, workspaceDir);
    this.registry = new ExtensionRegistry(logLevel, workspaceDir, extensionPaths);
    this.loader = new ExtensionLoader(logLevel, workspaceDir);
    this.validator = new ExtensionValidator();
  }

  public async loadAllExtensions(): Promise<void> {
    this.logger.info('Loading all extensions...');
    const manifests = await this.registry.discoverExtensions();

    for (const manifest of manifests) {
      const validationResult = this.validator.validate(manifest);
      if (!validationResult.isValid) {
        this.logger.error(`Invalid manifest for extension ${manifest.id}: ${validationResult.errors.join(', ')}`);
        continue;
      }

      try {
        const extension = await this.loader.load(manifest);
        this.registry.registerExtension(extension);
        this.emit('extension_loaded', extension);
      } catch (error) {
        this.logger.error(`Failed to load extension ${manifest.id}: ${error}`);
      }
    }
    this.logger.info('All extensions loaded.');
  }

  public async enableExtension(extensionId: string): Promise<void> {
    const extension = this.registry.getExtension(extensionId);
    if (!extension) {
      throw new Error(`Extension with id ${extensionId} not found.`);
    }

    if (extension.status === ExtensionStatus.ENABLED) {
      return;
    }

    try {
      await extension.enable();
      extension.status = ExtensionStatus.ENABLED;
      this.emit('extension_enabled', extension);
      this.logger.info(`Extension ${extensionId} enabled.`);
    } catch (error) {
      extension.status = ExtensionStatus.ERROR;
      this.logger.error(`Failed to enable extension ${extensionId}: ${error}`);
      throw error;
    }
  }

  public async disableExtension(extensionId: string): Promise<void> {
    const extension = this.registry.getExtension(extensionId);
    if (!extension) {
      throw new Error(`Extension with id ${extensionId} not found.`);
    }

    if (extension.status === ExtensionStatus.DISABLED) {
      return;
    }

    try {
      await extension.disable();
      extension.status = ExtensionStatus.DISABLED;
      this.emit('extension_disabled', extension);
      this.logger.info(`Extension ${extensionId} disabled.`);
    } catch (error) {
      extension.status = ExtensionStatus.ERROR;
      this.logger.error(`Failed to disable extension ${extensionId}: ${error}`);
      throw error;
    }
  }

  public getExtension(extensionId: string): Extension<any> | undefined {
    return this.registry.getExtension(extensionId);
  }

  public getAllExtensions(): Extension<any>[] {
    return this.registry.getAllExtensions();
  }
}
