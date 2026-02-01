import {
  Extension,
  ExtensionManifest,
  ExtensionManifestSchema,
  ExtensionRegistry,
} from './types.js';

/**
 * Core Extension Registry Implementation
 */
export class LocalExtensionRegistry implements ExtensionRegistry {
  private extensions: Map<string, Extension> = new Map();
  // In a real implementation this would perform filesystem ops
  private storageRoot: string;

  constructor(storageRoot: string) {
    this.storageRoot = storageRoot;
  }

  async register(manifest: ExtensionManifest): Promise<void> {
    // Validate manifest
    const parsed = ExtensionManifestSchema.parse(manifest);

    // Check duplication
    if (this.extensions.has(parsed.id)) {
      throw new Error(`Extension ${parsed.id} already exists`);
    }

    // Create entry
    const extension: Extension = {
      id: parsed.id,
      manifest: parsed,
      status: 'installed',
      path: `${this.storageRoot}/${parsed.id}`,
    };

    this.extensions.set(parsed.id, extension);
  }

  async unregister(id: string): Promise<void> {
    if (!this.extensions.has(id)) {
      throw new Error(`Extension ${id} not found`);
    }
    this.extensions.delete(id);
  }

  get(id: string): Extension | undefined {
    return this.extensions.get(id);
  }

  list(): Extension[] {
    return Array.from(this.extensions.values());
  }

  async load(id: string): Promise<void> {
    const ext = this.extensions.get(id);
    if (!ext) throw new Error(`Extension ${id} not found`);

    try {
      // Logic to dynamically import/load would go here
      // For now we just update state
      ext.status = 'enabled';
      ext.loadedAt = new Date();
    } catch (err) {
      ext.status = 'error';
      ext.error = err instanceof Error ? err.message : String(err);
      throw err;
    }
  }

  async unload(id: string): Promise<void> {
    const ext = this.extensions.get(id);
    if (!ext) throw new Error(`Extension ${id} not found`);

    ext.status = 'disabled';
    ext.loadedAt = undefined;
  }
}
