import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface MemoryProviderConfig {
  provider: string;
  enabled: boolean;
  config: Record<string, any>;
}

export interface MemoryProvider {
  name: string;
  description: string;
  requiresConfig: string[];
}

export class MemoryProviderService {
  private readonly configPath: string;
  private readonly tnfHome: string;

  private readonly providers: MemoryProvider[] = [
    {
      name: 'holographic',
      description: 'Local SQLite + HRR compositional retrieval (default, no API key needed)',
      requiresConfig: [],
    },
    {
      name: 'honcho',
      description: 'Remote Honcho memory service',
      requiresConfig: ['HONCHO_API_KEY'],
    },
    {
      name: 'mem0',
      description: 'Mem0 memory provider',
      requiresConfig: ['MEM0_API_KEY'],
    },
    {
      name: 'openviking',
      description: 'OpenViking memory service',
      requiresConfig: ['OPENVIKING_API_KEY'],
    },
    {
      name: 'hindsight',
      description: 'Hindsight memory provider',
      requiresConfig: ['HINDSIGHT_API_KEY'],
    },
    {
      name: 'retaindb',
      description: 'RetainDB persistent memory',
      requiresConfig: ['RETAINDB_URL'],
    },
    {
      name: 'byterover',
      description: 'ByteRover knowledge management',
      requiresConfig: ['BYTEROVER_API_KEY'],
    },
  ];

  constructor() {
    this.tnfHome = process.env.TNF_HOME || path.join(os.homedir(), '.tnf');
    this.configPath = path.join(this.tnfHome, 'memory_provider.json');
  }

  async getProviders(): Promise<(MemoryProvider & { enabled: boolean; type: string })[]> {
    const current = this.getCurrentConfig();
    return this.providers.map((p) => ({
      ...p,
      type: p.requiresConfig.length > 0 ? 'remote' : 'local',
      enabled: current.provider === p.name && current.enabled,
    }));
  }

  async setup(): Promise<MemoryProviderConfig> {
    const current = this.getCurrentConfig();
    console.log('\nAvailable Memory Providers:');
    console.log('===========================\n');

    this.providers.forEach((p, i) => {
      const isCurrent = current.provider === p.name;
      const marker = isCurrent ? '⚡ ' : '  ';
      console.log(`${marker}${i + 1}. ${p.name} - ${p.description}`);
      if (p.requiresConfig.length > 0) {
        console.log(`   Required env vars: ${p.requiresConfig.join(', ')}`);
      }
    });

    console.log('\n0. Disable external provider (use built-in only)');
    console.log('');

    // For CLI, we'll use a simple selection
    const selection = process.env.MEMORY_PROVIDER_SELECT || '0';
    const idx = parseInt(selection, 10);

    if (idx === 0) {
      return this.disableProvider();
    }

    if (idx < 1 || idx > this.providers.length) {
      throw new Error('Invalid selection');
    }

    const provider = this.providers[idx - 1];
    const config: Record<string, any> = {};

    // Check for required env vars
    for (const envVar of provider.requiresConfig) {
      const value = process.env[envVar];
      if (value) {
        config[envVar] = value;
      } else {
        console.log(`\n${envVar} not found in environment.`);
        // In interactive mode, we'd prompt here
        config[envVar] = 'PROMPT_REQUIRED';
      }
    }

    const result: MemoryProviderConfig = {
      provider: provider.name,
      enabled: true,
      config,
    };

    this.saveConfig(result);
    return result;
  }

  getCurrentConfig(): MemoryProviderConfig {
    if (fs.existsSync(this.configPath)) {
      try {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      } catch {
        // Invalid config, return default
      }
    }

    // Default to holographic
    return {
      provider: 'holographic',
      enabled: true,
      config: {},
    };
  }

  async status(): Promise<void> {
    const current = this.getCurrentConfig();
    const provider = this.providers.find((p) => p.name === current.provider);

    console.log('\nMemory Provider Status:');
    console.log('======================\n');
    console.log(`Current Provider: ${current.provider}`);
    console.log(`Status: ${current.enabled ? 'Enabled' : 'Disabled'}`);

    if (provider) {
      console.log(`Description: ${provider.description}`);
    }

    if (current.config && Object.keys(current.config).length > 0) {
      console.log('\nConfiguration:');
      for (const [key, value] of Object.entries(current.config)) {
        if (value === 'PROMPT_REQUIRED') {
          console.log(`  ${key}: [NOT CONFIGURED]`);
        } else if (key.includes('KEY') || key.includes('SECRET') || key.includes('TOKEN')) {
          console.log(`  ${key}: [HIDDEN]`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
    }

    console.log('\nBuilt-in Memory: Always active (MEMORY.md, USER.md)');
    console.log('');
  }

  async disableProvider(): Promise<MemoryProviderConfig> {
    const result: MemoryProviderConfig = {
      provider: 'none',
      enabled: false,
      config: {},
    };

    this.saveConfig(result);
    return result;
  }

  async reset(): Promise<void> {
    const memoryPath = path.join(this.tnfHome, 'memories');
    const userPath = path.join(this.tnfHome, 'USER.md');
    const memoryPathFile = path.join(this.tnfHome, 'MEMORY.md');

    const files = [memoryPath, userPath, memoryPathFile];

    for (const file of files) {
      if (fs.existsSync(file)) {
        if (fs.statSync(file).isDirectory()) {
          fs.rmSync(file, { recursive: true, force: true });
        } else {
          fs.unlinkSync(file);
        }
        console.log(`Removed: ${file}`);
      }
    }

    console.log('\nBuilt-in memory has been reset.');
    console.log('External provider configuration remains unchanged.');
    console.log('');
  }

  private saveConfig(config: MemoryProviderConfig): void {
    fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }
}
