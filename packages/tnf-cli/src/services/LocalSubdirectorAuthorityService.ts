/**
 * packages/tnf-cli/src/services/LocalSubdirectorAuthorityService.ts
 *
 * Implements the TNF Local Subdirector authority contract.
 */
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface LocalSubdirectorConfig {
  autonomyEnabled: boolean;
  capabilities: string[];
}

export class LocalSubdirectorAuthorityService {
  private configPath: string;
  private runtimeKeyPath: string;

  constructor(repoRoot: string) {
    let current = repoRoot;
    while (current !== '/' && !fs.existsSync(path.join(current, 'packages', 'tnf-cli'))) {
      current = path.dirname(current);
    }
    if (current === '/') {
      current = process.env.HOME || '/tmp';
    }
    this.configPath = path.join(current, '.tnf', 'local-subdirector.json');
    this.runtimeKeyPath = path.join(current, '.tnf', 'runtime-key');
  }

  private getRuntimeKey(): string {
    if (!fs.existsSync(this.runtimeKeyPath)) {
      fs.mkdirSync(path.dirname(this.runtimeKeyPath), { recursive: true });
      fs.writeFileSync(this.runtimeKeyPath, crypto.randomBytes(32).toString('hex'), {
        mode: 0o600,
      });
    }
    return fs.readFileSync(this.runtimeKeyPath, 'utf8').trim();
  }

  public signDelegation(capabilities: string[]): string {
    const key = this.getRuntimeKey();
    const payload = JSON.stringify({ capabilities, exp: Date.now() + 3600000 });
    const hmac = crypto.createHmac('sha256', key).update(payload).digest('hex');
    return Buffer.from(JSON.stringify({ payload, hmac })).toString('base64');
  }

  public verifyDelegation(token: string, capability: string): boolean {
    if (!token) return false;
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
      const key = this.getRuntimeKey();
      const expectedHmac = crypto.createHmac('sha256', key).update(decoded.payload).digest('hex');
      if (expectedHmac !== decoded.hmac) return false;
      const { capabilities, exp } = JSON.parse(decoded.payload);
      if (Date.now() > exp) return false;
      return capabilities.includes(capability) || capabilities.includes('all');
    } catch {
      return false;
    }
  }

  public verifyLocalSubdirectorIdentity(token: string): boolean {
    if (!token) return false;
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
      const key = this.getRuntimeKey();
      const expectedHmac = crypto.createHmac('sha256', key).update(decoded.payload).digest('hex');
      if (expectedHmac !== decoded.hmac) return false;
      const { role } = JSON.parse(decoded.payload);
      return role === 'local-subdirector';
    } catch {
      return false;
    }
  }

  public signLocalSubdirectorIdentity(): string {
    const key = this.getRuntimeKey();
    const payload = JSON.stringify({ role: 'local-subdirector', iat: Date.now() });
    const hmac = crypto.createHmac('sha256', key).update(payload).digest('hex');
    return Buffer.from(JSON.stringify({ payload, hmac })).toString('base64');
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
