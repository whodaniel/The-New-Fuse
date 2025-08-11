/**
 * Extension Loader - The New Fuse
 *
 * Responsible for loading the code of an extension from its entry point.
 */

import { Logger, LogLevel } from '@tnf/relay-core';
import { Extension, ExtensionManifest, ExtensionStatus } from './ExtensionTypes';

export class ExtensionLoader {
  private logger: Logger;

  constructor(logLevel: LogLevel, workspaceDir: string) {
    this.logger = new Logger(logLevel, workspaceDir);
  }

  public async load(manifest: ExtensionManifest): Promise<Extension<any>> {
    this.logger.info(`Loading extension: ${manifest.name}`);
    try {
      const module = await import(manifest.entryPoint);
      const instance = new module.default();

      const extension: Extension<any> = {
        manifest,
        instance,
        status: ExtensionStatus.LOADED,
        load: async () => {},
        unload: async () => {},
        enable: instance.enable ? instance.enable.bind(instance) : async () => {},
        disable: instance.disable ? instance.disable.bind(instance) : async () => {},
      };

      return extension;
    } catch (error) {
      this.logger.error(`Failed to load extension ${manifest.id}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
