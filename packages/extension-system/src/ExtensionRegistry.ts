/**
 * Extension Registry - The New Fuse
 *
 * Discovers and stores extensions from the filesystem.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { Logger, LogLevel } from '@the-new-fuse/relay-core';
import { Extension, ExtensionManifest } from './ExtensionTypes';

export class ExtensionRegistry {
  private logger: Logger;
  private extensionPaths: string[];
  private extensions: Map<string, Extension<any>> = new Map();

  constructor(logLevel: LogLevel, workspaceDir: string, extensionPaths: string[]) {
    this.logger = new Logger(logLevel, workspaceDir);
    this.extensionPaths = extensionPaths;
  }

  public async discoverExtensions(): Promise<ExtensionManifest[]> {
    const manifests: ExtensionManifest[] = [];
    for (const dir of this.extensionPaths) {
      try {
        const files = await fs.readdir(dir);
        for (const file of files) {
          const extPath = path.join(dir, file);
          if ((await fs.stat(extPath)).isDirectory()) {
            const manifestPath = path.join(extPath, 'package.json');
            try {
              const manifestContent = await fs.readFile(manifestPath, 'utf-8');
              const packageJson = JSON.parse(manifestContent);
              if (packageJson.theNewFuseExtension) {
                manifests.push(packageJson.theNewFuseExtension as ExtensionManifest);
              }
            } catch {
              // Not an extension, or invalid manifest
            }
          }
        }
      } catch (error) {
        this.logger.error(`Failed to discover extensions in ${dir}: ${error}`);
      }
    }
    return manifests;
  }

  public registerExtension(extension: Extension<any>): void {
    this.extensions.set(extension.manifest.id, extension);
    this.logger.info(`Extension registered: ${extension.manifest.name}`);
  }

  public getExtension(extensionId: string): Extension<any> | undefined {
    return this.extensions.get(extensionId);
  }

  public getAllExtensions(): Extension<any>[] {
    return Array.from(this.extensions.values());
  }
}
