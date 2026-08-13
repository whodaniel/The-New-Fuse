import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createHash, randomBytes } from 'crypto';
import { spawnSync } from 'child_process';

export interface AuthProvider {
  name: string;
  type: 'oauth' | 'api_key' | 'basic';
  configured: boolean;
  authenticated: boolean;
  expiresAt?: string;
}

export interface AuthCredential {
  provider: string;
  type: 'oauth' | 'api_key' | 'basic';
  accessToken?: string;
  apiKey?: string;
  username?: string;
  refreshToken?: string;
  expiresAt?: number;
  scopes?: string[];
}

export class AuthService {
  private configDir: string;
  private credentials: Map<string, AuthCredential> = new Map();
  private config: Record<string, string> = {};

  constructor(configDir?: string) {
    this.configDir = configDir || path.join(os.homedir(), '.config', 'tnf', 'auth');
    this.loadCredentials();
    this.loadConfig();
  }

  private loadCredentials(): void {
    const credPath = path.join(this.configDir, 'credentials.json');
    if (fs.existsSync(credPath)) {
      try {
        const creds = JSON.parse(fs.readFileSync(credPath, 'utf8'));
        for (const [name, cred] of Object.entries(creds) as [string, AuthCredential][]) {
          this.credentials.set(name, cred);
        }
      } catch {
        // Credentials don't exist or are invalid
      }
    }
  }

  private saveCredentials(): void {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
    const credPath = path.join(this.configDir, 'credentials.json');
    const credsObj: Record<string, AuthCredential> = {};
    for (const [name, cred] of this.credentials) {
      credsObj[name] = cred;
    }
    fs.writeFileSync(credPath, JSON.stringify(credsObj, null, 2));
  }

  private loadConfig(): void {
    const configPath = path.join(this.configDir, 'config.json');
    if (!fs.existsSync(configPath)) return;
    try {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8')) as Record<string, unknown>;
      this.config = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, String(value)])
      );
    } catch {
      this.config = {};
    }
  }

  private saveConfig(): void {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
    const configPath = path.join(this.configDir, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
  }

  listProviders(): AuthProvider[] {
    const providers: AuthProvider[] = [];

    const configuredProviders = [
      { name: 'openai', type: 'api_key' as const },
      { name: 'anthropic', type: 'api_key' as const },
      { name: 'google', type: 'oauth' as const },
      { name: 'github', type: 'oauth' as const },
      { name: 'gemini', type: 'oauth' as const },
      { name: 'deepseek', type: 'api_key' as const },
      { name: 'groq', type: 'api_key' as const },
      { name: 'openrouter', type: 'api_key' as const },
    ];

    for (const provider of configuredProviders) {
      const cred = this.credentials.get(provider.name);
      const authenticated = !!cred && (!cred.expiresAt || cred.expiresAt > Date.now());
      providers.push({
        name: provider.name,
        type: provider.type,
        configured: !!cred,
        authenticated,
        expiresAt: cred?.expiresAt ? new Date(cred.expiresAt).toISOString() : undefined,
      });
    }

    for (const [name, cred] of this.credentials) {
      if (!configuredProviders.some(p => p.name === name)) {
        const authenticated = !cred.expiresAt || cred.expiresAt > Date.now();
        providers.push({
          name,
          type: cred.type,
          configured: true,
          authenticated,
          expiresAt: cred.expiresAt ? new Date(cred.expiresAt).toISOString() : undefined,
        });
      }
    }

    return providers;
  }

  async login(provider: string, url?: string): Promise<{ success: boolean; message: string; url?: string }> {
    const existingEnvKey = this.getEnvKeyForProvider(provider);
    if (existingEnvKey && process.env[existingEnvKey]) {
      const cred: AuthCredential = {
        provider,
        type: 'api_key',
        apiKey: process.env[existingEnvKey],
      };
      this.credentials.set(provider, cred);
      this.saveCredentials();
      return { success: true, message: `Using ${existingEnvKey} from environment` };
    }

    if (provider === 'github') {
      return this.loginGitHub();
    }

    if (provider === 'google' || provider === 'gemini') {
      return this.loginGoogle(provider);
    }

    if (url) {
      return this.loginOAuth(provider, url);
    }

    return {
      success: false,
      message: `No login method available for provider '${provider}'. Set the appropriate API key environment variable or provide an OAuth URL.`,
    };
  }

  private getEnvKeyForProvider(provider: string): string | undefined {
    const mapping: Record<string, string> = {
      openai: 'OPENAI_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY',
      google: 'GOOGLE_API_KEY',
      gemini: 'GEMINI_API_KEY',
      deepseek: 'DEEPSEEK_API_KEY',
      groq: 'GROQ_API_KEY',
      openrouter: 'OPENROUTER_API_KEY',
    };
    return mapping[provider.toLowerCase()];
  }

  private async loginGitHub(): Promise<{ success: boolean; message: string; url?: string }> {
    try {
      const result = spawnSync('gh', ['auth', 'status'], { encoding: 'utf8' });
      if (result.status === 0) {
        const tokenResult = spawnSync('gh', ['auth', 'token'], { encoding: 'utf8' });
        if (tokenResult.status === 0) {
          const token = tokenResult.stdout.trim();
          const cred: AuthCredential = {
            provider: 'github',
            type: 'oauth',
            accessToken: token,
          };
          this.credentials.set('github', cred);
          this.saveCredentials();
          return { success: true, message: 'GitHub authentication verified via gh CLI' };
        }
      }

      const loginUrl = 'https://github.com/login/device';
      return { success: false, message: 'GitHub CLI not authenticated. Run: gh auth login', url: loginUrl };
    } catch (e) {
      return { success: false, message: `GitHub login failed: ${(e as Error).message}` };
    }
  }

  private async loginGoogle(provider: string): Promise<{ success: boolean; message: string; url?: string }> {
    const envKey = provider === 'gemini' ? 'GEMINI_API_KEY' : 'GOOGLE_API_KEY';
    if (process.env[envKey]) {
      const cred: AuthCredential = {
        provider,
        type: 'api_key',
        apiKey: process.env[envKey],
      };
      this.credentials.set(provider, cred);
      this.saveCredentials();
      return { success: true, message: `${provider} API key loaded from ${envKey}` };
    }

    return {
      success: false,
      message: `Set ${envKey} environment variable or use OAuth flow`,
      url: 'https://aistudio.google.com/app/apikey',
    };
  }

  private async loginOAuth(provider: string, url: string): Promise<{ success: boolean; message: string }> {
    const state = randomBytes(16).toString('hex');
    const authUrl = new URL(url);
    authUrl.searchParams.set('state', state);

    console.log(`\n  Opening browser to: ${authUrl.toString()}`);
    console.log(`  Waiting for authorization...\n`);

    try {
      const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
      spawnSync(opener, [authUrl.toString()]);
    } catch {
      // Browser open failed, user can manually navigate
    }

    return {
      success: false,
      message: `OAuth flow initiated. After authorizing, run: tnf auth set-token ${provider} <token>`,
    };
  }

  setToken(provider: string, token: string, options?: { refreshToken?: string; expiresIn?: number }): void {
    const cred: AuthCredential = {
      provider,
      type: 'oauth',
      accessToken: token,
      refreshToken: options?.refreshToken,
      expiresAt: options?.expiresIn ? Date.now() + options.expiresIn * 1000 : undefined,
    };
    this.credentials.set(provider, cred);
    this.saveCredentials();
  }

  setApiKey(provider: string, apiKey: string): void {
    const cred: AuthCredential = {
      provider,
      type: 'api_key',
      apiKey,
    };
    this.credentials.set(provider, cred);
    this.saveCredentials();
  }

  logout(provider: string): boolean {
    const existed = this.credentials.delete(provider);
    if (existed) {
      this.saveCredentials();
    }
    return existed;
  }

  getCredential(provider: string): AuthCredential | undefined {
    return this.credentials.get(provider);
  }

  setConfig(key: string, value: string): boolean {
    const normalizedKey = key.trim();
    if (!normalizedKey) return false;
    this.config[normalizedKey] = value;
    this.saveConfig();
    return true;
  }

  getConfig(key: string): string | null {
    const normalizedKey = key.trim();
    if (!normalizedKey) return null;
    return Object.prototype.hasOwnProperty.call(this.config, normalizedKey)
      ? this.config[normalizedKey]
      : null;
  }

  listConfig(): Record<string, string> {
    return { ...this.config };
  }
}
