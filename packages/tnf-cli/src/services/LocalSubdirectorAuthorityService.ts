/**
 * packages/tnf-cli/src/services/LocalSubdirectorAuthorityService.ts
 *
 * Implements the TNF Local Subdirector authority contract.
 */
import * as fs from 'fs';
import * as path from 'path';

export interface LocalSubdirectorConfig {
  autonomyEnabled: boolean;
  capabilities: string[];
}

export class LocalSubdirectorAuthorityService {
  private configPath: string;

  constructor(repoRoot: string) {
    let current = repoRoot;
    while (current !== '/' && !fs.existsSync(path.join(current, 'packages', 'tnf-cli'))) {
      current = path.dirname(current);
    }
    if (current === '/') {
       current = process.env.HOME || '/tmp';
    }
    this.configPath = path.join(current, '.tnf', 'local-subdirector.json');
  }

  public getConfig(): LocalSubdirectorConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      }
    } catch {}
    return {
      autonomyEnabled: false,
      capabilities: [],
    };
  }

  public updateConfig(config: Partial<LocalSubdirectorConfig>): LocalSubdirectorConfig {
    const current = this.getConfig();
    const updated = { ...current, ...config };
    fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
    fs.writeFileSync(this.configPath, JSON.stringify(updated, null, 2), 'utf8');
    return updated;
  }

  public isAuthorized(capability: string): boolean {
    const config = this.getConfig();
    if (!config.autonomyEnabled) return false;
    if (config.capabilities.includes('all')) return true;
    return config.capabilities.includes(capability);
  }
}
