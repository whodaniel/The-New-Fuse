/**
 * packages/tnf-cli/src/services/LocalSubdirectorAuthorityService.ts
 *
 * Implements the TNF Local Subdirector authority contract.
 */
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface LocalSubdirectorConfig {
  /** Agent this authority is bound to. Authority is not granted to whoever asks. */
  agentId: string;
  autonomyEnabled: boolean;
  capabilities: string[];
}

/**
 * Shipped default: the local subdirector operates autonomously.
 *
 * This is deliberate and is the operator's stated posture — `tnf-cli-agent` is
 * meant to drive the local fleet without per-action prompting. It applies ONLY
 * when no config file exists yet (first run). A config that exists but cannot
 * be read is a different situation and fails closed below, so a corrupted or
 * truncated file can never silently widen authority.
 *
 * Onboarding surfaces these values and is the place to narrow them.
 */
export const DEFAULT_LOCAL_SUBDIRECTOR_CONFIG: LocalSubdirectorConfig = {
  agentId: 'tnf-cli-agent',
  autonomyEnabled: true,
  capabilities: ['all'],
};

/** Fail-closed shape, used when a config exists but is unreadable. */
const DENIED_CONFIG: LocalSubdirectorConfig = {
  agentId: 'tnf-cli-agent',
  autonomyEnabled: false,
  capabilities: [],
};

export class LocalSubdirectorAuthorityService {
  private configPath: string;
  private runtimeKeyPath: string;

  /**
   * Both files are machine-local, under `~/.tnf/`.
   *
   * They used to be resolved by walking up from the caller's path to the repo
   * containing `packages/tnf-cli`, which was wrong twice over. First, it put a
   * 32-byte HMAC signing key at `<repo>/.tnf/runtime-key` — and `.tnf/` is a
   * TRACKED directory in this repo, not gitignored, so enabling autonomy would
   * have written a secret into a checkout that gets pushed. Second, callers
   * disagreed about what to pass (`agents-run` passes the tool cwd,
   * `subdirector` passes the repo root), so the same machine could read two
   * different authority configs depending on where you invoked from.
   *
   * `~/.tnf/` is where the operator's identity already lives (`agent.yaml`), so
   * this also puts authority state next to the identity it describes.
   *
   * The parameter is retained for call-site compatibility and is unused.
   */
  constructor(_repoRoot?: string) {
    // TNF_AUTHORITY_HOME exists so tests can exercise real signing and config
    // writes without touching the operator's live `~/.tnf/` — moving these
    // files to the home directory otherwise made the service untestable
    // without side effects on the running machine.
    const home = process.env.TNF_AUTHORITY_HOME || os.homedir() || process.env.HOME || '/tmp';
    this.configPath = path.join(home, '.tnf', 'local-subdirector.json');
    this.runtimeKeyPath = path.join(home, '.tnf', 'runtime-key');
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

  /** True when no authority config has been written yet (first run). */
  public isFirstRun(): boolean {
    return !fs.existsSync(this.configPath);
  }

  public configLocation(): string {
    return this.configPath;
  }

  public getConfig(): LocalSubdirectorConfig {
    if (!fs.existsSync(this.configPath)) {
      return { ...DEFAULT_LOCAL_SUBDIRECTOR_CONFIG };
    }
    try {
      const parsed = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      return {
        agentId: parsed.agentId || DEFAULT_LOCAL_SUBDIRECTOR_CONFIG.agentId,
        autonomyEnabled: Boolean(parsed.autonomyEnabled),
        capabilities: Array.isArray(parsed.capabilities) ? parsed.capabilities : [],
      };
    } catch {
      // The file exists but is unreadable. Never widen authority on an error.
      return { ...DENIED_CONFIG };
    }
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
