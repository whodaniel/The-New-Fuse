import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

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
  config?: Record<string, any>;
  installedAt: string;
  updatedAt: string;
}

export class PluginsService {
  private readonly pluginsDir: string;
  private readonly registryPath: string;

  constructor() {
    this.pluginsDir = path.join(os.homedir(), '.tnf', 'plugins');
    this.registryPath = path.join(this.pluginsDir, 'registry.json');
    this.ensureDir();
  }

  private ensureDir(): void {
    fs.mkdirSync(this.pluginsDir, { recursive: true });
  }

  async list(): Promise<Plugin[]> {
    if (!fs.existsSync(this.registryPath)) {
      return this.getDefaultPlugins();
    }

    try {
      const data = fs.readFileSync(this.registryPath, 'utf8');
      return JSON.parse(data);
    } catch {
      return this.getDefaultPlugins();
    }
  }

  async install(name: string, version?: string): Promise<Plugin> {
    const plugins = await this.list();
    const existing = plugins.find((p) => p.name === name);

    if (existing) {
      if (existing.status === 'active') {
        throw new Error(`Plugin ${name} is already installed and active`);
      }
      existing.status = 'active';
      existing.version = version || existing.version;
      existing.updatedAt = new Date().toISOString();
      await this.save(plugins);
      return existing;
    }

    // In production, this would fetch from a registry
    const pluginDir = path.join(this.pluginsDir, name);
    fs.mkdirSync(pluginDir, { recursive: true });

    const plugin: Plugin = {
      name,
      version: version || 'latest',
      description: `Plugin ${name}`,
      author: 'TNF Plugin Registry',
      status: 'active',
      category: 'general',
      dependencies: [],
      installedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    plugins.push(plugin);
    await this.save(plugins);
    return plugin;
  }

  async remove(name: string): Promise<void> {
    const plugins = await this.list();
    const index = plugins.findIndex((p) => p.name === name);

    if (index === -1) {
      throw new Error(`Plugin not found: ${name}`);
    }

    plugins.splice(index, 1);
    await this.save(plugins);

    // Remove plugin directory
    const pluginDir = path.join(this.pluginsDir, name);
    if (fs.existsSync(pluginDir)) {
      fs.rmSync(pluginDir, { recursive: true, force: true });
    }
  }

  async update(name?: string): Promise<Plugin[]> {
    const plugins = await this.list();

    if (name) {
      const plugin = plugins.find((p) => p.name === name);
      if (!plugin) {
        throw new Error(`Plugin not found: ${name}`);
      }
      plugin.updatedAt = new Date().toISOString();
      // In production, this would fetch new version from registry
      await this.save(plugins);
      return [plugin];
    }

    // Update all plugins
    for (const plugin of plugins) {
      if (plugin.status === 'active') {
        plugin.updatedAt = new Date().toISOString();
      }
    }

    await this.save(plugins);
    return plugins.filter((p) => p.status === 'active');
  }

  async enable(name: string): Promise<Plugin> {
    const plugins = await this.list();
    const plugin = plugins.find((p) => p.name === name);

    if (!plugin) {
      throw new Error(`Plugin not found: ${name}`);
    }

    plugin.status = 'active';
    plugin.updatedAt = new Date().toISOString();
    await this.save(plugins);
    return plugin;
  }

  async disable(name: string): Promise<Plugin> {
    const plugins = await this.list();
    const plugin = plugins.find((p) => p.name === name);

    if (!plugin) {
      throw new Error(`Plugin not found: ${name}`);
    }

    plugin.status = 'disabled';
    plugin.updatedAt = new Date().toISOString();
    await this.save(plugins);
    return plugin;
  }

  async getStatus(name: string): Promise<Plugin | undefined> {
    const plugins = await this.list();
    return plugins.find((p) => p.name === name);
  }

  private async save(plugins: Plugin[]): Promise<void> {
    fs.writeFileSync(this.registryPath, JSON.stringify(plugins, null, 2));
  }

  private getDefaultPlugins(): Plugin[] {
    return [
      {
        name: 'rate-limit-failover',
        version: '1.2.0',
        description: 'Rate limit & failover routing for LLM providers',
        author: 'TNF',
        status: 'active',
        category: 'infrastructure',
        dependencies: [],
        installedAt: '2026-04-01',
        updatedAt: '2026-04-15',
      },
      {
        name: 'model-health-monitor',
        version: '0.8.0',
        description: 'Real-time provider health monitoring',
        author: 'TNF',
        status: 'active',
        category: 'infrastructure',
        dependencies: [],
        installedAt: '2026-04-05',
        updatedAt: '2026-04-10',
      },
      {
        name: 'webpilot',
        version: '0.5.0',
        description: 'CDP-free browser automation',
        author: 'TNF',
        status: 'installed',
        category: 'automation',
        dependencies: [],
        installedAt: '2026-04-10',
        updatedAt: '2026-04-10',
      },
      {
        name: 'xurl',
        version: '1.0.0',
        description: 'X/Twitter integration',
        author: 'TNF',
        status: 'installed',
        category: 'social',
        dependencies: [],
        installedAt: '2026-04-12',
        updatedAt: '2026-04-12',
      },
      {
        name: 'spotify',
        version: '0.9.0',
        description: 'Spotify playback & management',
        author: 'TNF',
        status: 'disabled',
        category: 'media',
        dependencies: [],
        installedAt: '2026-04-01',
        updatedAt: '2026-04-08',
      },
    ];
  }
}
