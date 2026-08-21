import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Worker } from 'node:worker_threads';
import {
  assertLoadableExtension,
  readTnfExtensionManifest,
  TNF_EXTENSION_MANIFEST_FILENAME,
  type ExtensionDistributionKind,
  type TnfExtensionManifestV1,
} from '@the-new-fuse/protocol-contracts/extension-manifest.js';

export interface Plugin {
  name: string;
  version: string;
  description: string;
  author: string;
  repository?: string;
  homepage?: string;
  status: 'active' | 'installed' | 'disabled' | 'error';
  category: string;
  dependencies: string[];
  config?: Record<string, unknown>;
  kind?: ExtensionDistributionKind | 'skill';
  source?: string;
  sourceRef?: string;
  manifestPath?: string;
  lastError?: string;
  installedAt: string;
  updatedAt: string;
}

export interface PluginsServiceOptions {
  homeDir?: string;
  projectRoot?: string;
  runtimeVersion?: string;
}

export class PluginsService {
  private readonly pluginsDir: string;
  private readonly registryPath: string;
  private readonly projectRoot: string;
  private readonly runtimeVersion: string;

  constructor(options: PluginsServiceOptions = {}) {
    this.pluginsDir = path.join(options.homeDir || os.homedir(), '.tnf', 'plugins');
    this.registryPath = path.join(this.pluginsDir, 'registry.json');
    this.projectRoot = options.projectRoot || this.findProjectRoot();
    this.runtimeVersion = options.runtimeVersion || '1.0.0';
    fs.mkdirSync(this.pluginsDir, { recursive: true });
  }

  async list(): Promise<Plugin[]> {
    if (!fs.existsSync(this.registryPath)) return this.getDefaultPlugins();
    try {
      const parsed: unknown = JSON.parse(fs.readFileSync(this.registryPath, 'utf8'));
      return Array.isArray(parsed) ? (parsed as Plugin[]) : this.getDefaultPlugins();
    } catch {
      return this.getDefaultPlugins();
    }
  }

  async install(source: string, version?: string): Promise<Plugin> {
    const materialized = this.materializeSource(source, version);
    let destination = '';
    try {
      const manifest = this.readManifest(materialized.path);
      assertLoadableExtension(manifest);
      const plugins = await this.list();
      if (plugins.some((plugin) => plugin.name === manifest.id)) {
        throw new Error(`Plugin ${manifest.id} is already installed`);
      }

      destination = path.join(this.pluginsDir, manifest.id);
      if (fs.existsSync(destination))
        throw new Error(`Plugin directory already exists: ${destination}`);
      fs.renameSync(materialized.path, destination);

      const now = new Date().toISOString();
      const plugin = this.pluginFromManifest(
        manifest,
        materialized.source,
        version,
        'installed',
        now
      );
      plugins.push(plugin);
      await this.save(plugins);
      return plugin;
    } catch (error) {
      if (destination && fs.existsSync(destination)) {
        fs.rmSync(destination, { recursive: true, force: true });
      }
      throw error;
    } finally {
      if (fs.existsSync(materialized.path)) {
        fs.rmSync(materialized.path, { recursive: true, force: true });
      }
    }
  }

  async remove(name: string): Promise<void> {
    const plugins = await this.list();
    const index = plugins.findIndex((plugin) => plugin.name === name);
    if (index === -1) throw new Error(`Plugin not found: ${name}`);

    if (plugins[index].status === 'active') await this.runLifecycle(plugins[index], 'deactivate');
    plugins.splice(index, 1);
    await this.save(plugins);
    const pluginDir = path.join(this.pluginsDir, name);
    if (fs.existsSync(pluginDir)) fs.rmSync(pluginDir, { recursive: true, force: true });
  }

  async update(name?: string): Promise<Plugin[]> {
    const plugins = await this.list();
    const selected = name
      ? plugins.filter((plugin) => plugin.name === name)
      : plugins.filter((plugin) => plugin.kind === 'loadable-extension');
    if (name && selected.length === 0) throw new Error(`Plugin not found: ${name}`);

    try {
      for (const plugin of selected) await this.updateOne(plugin);
    } catch (error) {
      await this.save(plugins);
      throw error;
    }
    await this.save(plugins);
    return selected;
  }

  async enable(name: string): Promise<Plugin> {
    const plugins = await this.list();
    const plugin = plugins.find((entry) => entry.name === name);
    if (!plugin) throw new Error(`Plugin not found: ${name}`);
    if (plugin.kind !== 'loadable-extension') throw new Error(`Plugin ${name} is not loadable`);

    try {
      await this.runLifecycle(plugin, 'activate');
      plugin.status = 'active';
      plugin.lastError = undefined;
    } catch (error) {
      plugin.status = 'error';
      plugin.lastError = error instanceof Error ? error.message : String(error);
      await this.save(plugins);
      throw error;
    }
    plugin.updatedAt = new Date().toISOString();
    await this.save(plugins);
    return plugin;
  }

  async disable(name: string): Promise<Plugin> {
    const plugins = await this.list();
    const plugin = plugins.find((entry) => entry.name === name);
    if (!plugin) throw new Error(`Plugin not found: ${name}`);

    try {
      if (plugin.status === 'active') await this.runLifecycle(plugin, 'deactivate');
      plugin.status = 'disabled';
      plugin.lastError = undefined;
    } catch (error) {
      plugin.status = 'error';
      plugin.lastError = error instanceof Error ? error.message : String(error);
      await this.save(plugins);
      throw error;
    }
    plugin.updatedAt = new Date().toISOString();
    await this.save(plugins);
    return plugin;
  }

  async getStatus(name: string): Promise<Plugin | undefined> {
    return (await this.list()).find((plugin) => plugin.name === name);
  }

  private readManifest(extensionPath: string): TnfExtensionManifestV1 {
    return readTnfExtensionManifest(extensionPath, {
      tnfVersion: this.runtimeVersion,
      nodeVersion: process.versions.node,
    });
  }

  private materializeSource(source: string, version?: string): { path: string; source: string } {
    const stagingPath = fs.mkdtempSync(path.join(this.pluginsDir, '.install-'));
    const localPath = source.startsWith('file://')
      ? fileURLToPath(source)
      : path.resolve(this.projectRoot, source);

    if (fs.existsSync(localPath)) {
      if (!fs.statSync(localPath).isDirectory()) {
        fs.rmSync(stagingPath, { recursive: true, force: true });
        throw new Error(`Extension source must be a directory: ${source}`);
      }
      fs.rmSync(stagingPath, { recursive: true, force: true });
      fs.cpSync(localPath, stagingPath, { recursive: true, errorOnExist: true });
      return { path: stagingPath, source: path.resolve(localPath) };
    }

    if (/^(?:https?:\/\/|ssh:\/\/|git@)/.test(source)) {
      if (/^https?:\/\//.test(source)) {
        let sourceUrl: URL;
        try {
          sourceUrl = new URL(source);
        } catch {
          fs.rmSync(stagingPath, { recursive: true, force: true });
          throw new Error(`Invalid Git URL: ${source}`);
        }
        if (sourceUrl.username || sourceUrl.password) {
          fs.rmSync(stagingPath, { recursive: true, force: true });
          throw new Error(
            'Credential-bearing Git URLs are not accepted. Use the Git credential helper or SSH agent.'
          );
        }
      }
      const args = ['clone', '--depth', '1'];
      if (version) args.push('--branch', version);
      args.push('--', source, stagingPath);
      try {
        execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      } catch (error) {
        fs.rmSync(stagingPath, { recursive: true, force: true });
        throw new Error(
          `Failed to clone extension source: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      return { path: stagingPath, source };
    }

    fs.rmSync(stagingPath, { recursive: true, force: true });
    throw new Error(
      `Unsupported extension source "${source}". Use a local directory, file:// URL, or Git URL containing ${TNF_EXTENSION_MANIFEST_FILENAME}`
    );
  }

  private pluginFromManifest(
    manifest: TnfExtensionManifestV1,
    source: string,
    sourceRef: string | undefined,
    status: Plugin['status'],
    installedAt: string
  ): Plugin {
    return {
      name: manifest.id,
      version: manifest.version,
      description: manifest.description,
      author: manifest.author || 'TNF Extension',
      repository: manifest.repository,
      status,
      category: 'tnf-extension',
      dependencies: [],
      config: manifest.configuration?.defaults,
      kind: manifest.kind,
      source,
      sourceRef,
      manifestPath: path.join(this.pluginsDir, manifest.id, TNF_EXTENSION_MANIFEST_FILENAME),
      installedAt,
      updatedAt: new Date().toISOString(),
    };
  }

  private async updateOne(plugin: Plugin): Promise<void> {
    if (!plugin.source || plugin.kind !== 'loadable-extension') {
      throw new Error(`Plugin ${plugin.name} has no updateable extension source`);
    }
    const materialized = this.materializeSource(plugin.source, plugin.sourceRef);
    const destination = path.join(this.pluginsDir, plugin.name);
    const backup = `${destination}.backup-${process.pid}-${Date.now()}`;
    const previous = { ...plugin };
    const wasActive = plugin.status === 'active';
    try {
      const manifest = this.readManifest(materialized.path);
      assertLoadableExtension(manifest);
      if (manifest.id !== plugin.name)
        throw new Error(`Update manifest id changed to ${manifest.id}`);
      if (wasActive) await this.runLifecycle(plugin, 'deactivate');
      fs.renameSync(destination, backup);
      fs.renameSync(materialized.path, destination);
      Object.assign(
        plugin,
        this.pluginFromManifest(
          manifest,
          plugin.source,
          plugin.sourceRef,
          wasActive ? 'installed' : plugin.status,
          plugin.installedAt
        )
      );
      if (wasActive) {
        await this.runLifecycle(plugin, 'activate');
        plugin.status = 'active';
      }
      plugin.lastError = undefined;
      fs.rmSync(backup, { recursive: true, force: true });
    } catch (error) {
      if (fs.existsSync(destination)) fs.rmSync(destination, { recursive: true, force: true });
      if (fs.existsSync(backup)) fs.renameSync(backup, destination);
      Object.assign(plugin, previous);
      if (wasActive) {
        try {
          await this.runLifecycle(plugin, 'activate');
        } catch (rollbackError) {
          plugin.status = 'error';
          plugin.lastError = `Update failed and rollback activation failed: ${
            rollbackError instanceof Error ? rollbackError.message : String(rollbackError)
          }`;
        }
      }
      throw error;
    } finally {
      if (fs.existsSync(materialized.path))
        fs.rmSync(materialized.path, { recursive: true, force: true });
      if (fs.existsSync(backup)) fs.rmSync(backup, { recursive: true, force: true });
    }
  }

  private async runLifecycle(plugin: Plugin, action: 'activate' | 'deactivate'): Promise<void> {
    const pluginDir = path.join(this.pluginsDir, plugin.name);
    const manifest = this.readManifest(pluginDir);
    assertLoadableExtension(manifest);
    const entrypoint = manifest.entrypoints[action] || manifest.entrypoints.main;
    if (!entrypoint) return;

    const timeoutMs = manifest.lifecycle?.timeoutMs || 10_000;
    const moduleUrl = `${pathToFileURL(path.join(pluginDir, entrypoint)).href}?tnf=${Date.now()}`;
    const workerSource = `
const { parentPort, workerData } = require('node:worker_threads');
(async () => {
  const loaded = await import(workerData.moduleUrl);
  const owner = loaded.default && typeof loaded.default === 'object' ? loaded.default : loaded;
  const hook = loaded[workerData.action] || loaded[workerData.hookName] ||
    owner[workerData.action] || owner[workerData.hookName];
  if (typeof hook === 'function') await hook.call(owner, workerData.context);
  parentPort.postMessage({ ok: true });
})().catch((error) => {
  parentPort.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) });
});
`;
    const worker = new Worker(workerSource, {
      eval: true,
      name: `tnf-extension-${manifest.id}-${action}`,
      workerData: {
        moduleUrl,
        action,
        hookName: action === 'activate' ? 'onActivate' : 'onDeactivate',
        context: {
          extensionId: manifest.id,
          extensionPath: pluginDir,
          configuration: plugin.config || {},
        },
      },
    });

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const finish = (error?: Error): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        void worker.terminate();
        if (error) reject(error);
        else resolve();
      };
      const timeout = setTimeout(
        () => finish(new Error(`${action} timed out after ${timeoutMs}ms`)),
        timeoutMs
      );
      worker.once('message', (message: { ok?: boolean; error?: string }) => {
        finish(message.ok ? undefined : new Error(message.error || `${action} failed`));
      });
      worker.once('error', (error) => finish(error));
      worker.once('exit', (code) => {
        if (!settled) {
          finish(
            new Error(
              code === 0
                ? `${action} worker exited before reporting completion`
                : `${action} worker exited with code ${code}`
            )
          );
        }
      });
    });
  }

  private async save(plugins: Plugin[]): Promise<void> {
    const temporaryPath = `${this.registryPath}.tmp-${process.pid}`;
    try {
      fs.writeFileSync(temporaryPath, `${JSON.stringify(plugins, null, 2)}\n`, { mode: 0o600 });
      fs.renameSync(temporaryPath, this.registryPath);
    } finally {
      if (fs.existsSync(temporaryPath)) fs.rmSync(temporaryPath, { force: true });
    }
  }

  private getDefaultPlugins(): Plugin[] {
    const discovered: Plugin[] = [];
    const skillDirs = [
      { base: path.join(this.projectRoot, '.agent', 'skills'), category: 'tnf-skill' },
      { base: path.join(this.projectRoot, '.claude', 'skills'), category: 'claude-skill' },
      { base: path.join(os.homedir(), '.gemini', 'config', 'plugins'), category: 'gemini-plugin' },
    ];

    for (const { base, category } of skillDirs) {
      if (!fs.existsSync(base)) continue;
      try {
        for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
          if (!entry.isDirectory()) continue;
          const skillMd = path.join(base, entry.name, 'SKILL.md');
          const pluginJson = path.join(base, entry.name, 'plugin.json');
          if (!fs.existsSync(skillMd) && !fs.existsSync(pluginJson)) continue;
          let description = `${category}: ${entry.name}`;
          if (fs.existsSync(skillMd)) {
            try {
              const match = fs
                .readFileSync(skillMd, 'utf8')
                .slice(0, 500)
                .match(/description:\s*(.+)/i);
              if (match) description = match[1].trim();
            } catch {
              // Discovery is best-effort; unreadable skills are still listed.
            }
          }
          const now = new Date().toISOString();
          discovered.push({
            name: entry.name,
            version: '1.0.0',
            description,
            author:
              category === 'tnf-skill'
                ? 'TNF'
                : category === 'claude-skill'
                  ? 'Anthropic'
                  : 'Google',
            status: 'active',
            category,
            dependencies: [],
            kind: 'skill',
            installedAt: now,
            updatedAt: now,
          });
        }
      } catch {
        // A missing optional runtime directory must not break the CLI.
      }
    }
    return discovered;
  }

  private findProjectRoot(): string {
    const candidates = [
      process.cwd(),
      path.join(process.cwd(), '..', '..'),
      path.join(os.homedir(), 'Desktop', 'A1-Inter-LLM-Com', 'TNF', 'The-New-Fuse'),
    ];
    return (
      candidates.find(
        (candidate) =>
          fs.existsSync(path.join(candidate, 'tnf')) ||
          fs.existsSync(path.join(candidate, 'packages', 'tnf-cli'))
      ) || process.cwd()
    );
  }
}
