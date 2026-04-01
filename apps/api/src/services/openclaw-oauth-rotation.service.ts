// @ts-nocheck
import { Injectable } from '@nestjs/common';
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { drizzleConfigurationRepository } from '@the-new-fuse/database/drizzle/repositories';
import * as crypto from 'crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  OpenClawProvider,
  UpsertOpenClawOAuthBindingDto,
} from '../dto/openclaw-oauth-rotation.dto';

const execFileAsync = promisify(execFile);

const OAUTH_BINDING_PREFIX = 'OPENCLAW_OAUTH_BINDING_V1';
const ENCRYPTION_SALT = 'openclaw-oauth-binding-v1';
const ALGORITHM = 'aes-256-gcm';

interface OpenClawOAuthSecretPayload {
  deleted?: boolean;
  tenantId: string;
  service: string;
  provider: OpenClawProvider;
  accessToken: string;
  refreshToken: string;
  accountId?: string;
  googleEmail?: string;
  googleProjectId?: string;
  primaryModel: string;
  fallbackModels: string;
}

export interface OpenClawOAuthBindingSummary {
  key: string;
  tenantId: string;
  service: string;
  provider: OpenClawProvider;
  hasAccountId: boolean;
  updatedAt: Date;
  updatedBy: string | null;
}

export interface OpenClawOAuthExecutionResult {
  service: string;
  provider: OpenClawProvider;
  deployStatus: string | null;
  deployId: string | null;
  deployCreatedAt: string | null;
  overviewStatus: number | null;
  verified: {
    primaryModel: string;
    fallbackModels: string;
    useCodexOAuth?: string;
    accountId?: string;
  };
}

@Injectable()
export class OpenClawOAuthRotationService {
  private getEncryptionKey(): Buffer {
    const secret = process.env.ENCRYPTION_KEY;
    if (!secret) throw new Error('ENCRYPTION_KEY is required');
    return crypto.scryptSync(secret, ENCRYPTION_SALT, 32);
  }

  private encrypt(plainText: string): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  private decrypt(cipherText: string): string {
    const key = this.getEncryptionKey();
    const [ivHex, tagHex, encryptedHex] = cipherText.split(':');
    if (!ivHex || !tagHex || !encryptedHex) {
      throw new Error('Invalid encrypted payload');
    }
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  }

  private makeKey(tenantId: string, service: string, provider: string): string {
    return `${OAUTH_BINDING_PREFIX}:${tenantId.trim()}:${service.trim()}:${provider.trim()}`;
  }

  private parseKey(key: string): { tenantId: string; service: string; provider: OpenClawProvider } {
    const parts = key.split(':');
    if (parts.length < 4) {
      throw new Error(`Invalid binding key format: ${key}`);
    }
    return {
      tenantId: parts[1],
      service: parts[2],
      provider: parts[3] as OpenClawProvider,
    };
  }

  async listBindings(): Promise<OpenClawOAuthBindingSummary[]> {
    const rows = await drizzleConfigurationRepository.findAllConfigs();
    return rows
      .filter((row: any) => row.key.startsWith(`${OAUTH_BINDING_PREFIX}:`))
      .flatMap((row: any) => {
        const parsed = this.parseKey(row.key);
        let hasAccountId = false;
        let deleted = false;
        try {
          const payload = JSON.parse(this.decrypt(row.value)) as OpenClawOAuthSecretPayload;
          deleted = Boolean(payload.deleted);
          hasAccountId = Boolean(payload.accountId);
        } catch {
          hasAccountId = false;
        }
        if (deleted) return [];
        return [
          {
            key: row.key,
            tenantId: parsed.tenantId,
            service: parsed.service,
            provider: parsed.provider,
            hasAccountId,
            updatedAt: row.updatedAt,
            updatedBy: row.updatedBy ?? null,
          },
        ];
      })
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async upsertBinding(
    userId: string,
    dto: UpsertOpenClawOAuthBindingDto
  ): Promise<OpenClawOAuthBindingSummary> {
    const key = this.makeKey(dto.tenantId, dto.service, dto.provider);
    const payload: OpenClawOAuthSecretPayload = {
      tenantId: dto.tenantId.trim(),
      service: dto.service.trim(),
      provider: dto.provider,
      accessToken: dto.accessToken,
      refreshToken: dto.refreshToken,
      accountId: dto.accountId?.trim() || undefined,
      googleEmail: dto.googleEmail?.trim() || undefined,
      googleProjectId: dto.googleProjectId?.trim() || undefined,
      primaryModel: dto.primaryModel.trim(),
      fallbackModels: dto.fallbackModels.trim(),
    };
    const encrypted = this.encrypt(JSON.stringify(payload));
    const row = await drizzleConfigurationRepository.updateConfig(key, encrypted, userId);
    return {
      key: row.key,
      tenantId: payload.tenantId,
      service: payload.service,
      provider: payload.provider,
      hasAccountId: Boolean(payload.accountId),
      updatedAt: row.updatedAt,
      updatedBy: row.updatedBy ?? null,
    };
  }

  async deleteBinding(
    tenantId: string,
    service: string,
    provider: OpenClawProvider
  ): Promise<void> {
    const key = this.makeKey(tenantId, service, provider);
    await drizzleConfigurationRepository.updateConfig(
      key,
      this.encrypt(
        JSON.stringify({
          deleted: true,
          tenantId: tenantId.trim(),
          service: service.trim(),
          provider,
          accessToken: '',
          refreshToken: '',
          primaryModel: '',
          fallbackModels: '',
        })
      ),
      'system'
    );
  }

  private async runRailway(args: string[], timeoutMs = 120000): Promise<string> {
    const { stdout, stderr } = await execFileAsync('railway', args, {
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024 * 8,
    });
    if (stderr && /error|failed/i.test(stderr)) {
      // Some railway commands use stderr for progress logs; only treat strong errors later.
    }
    return String(stdout || '').trim();
  }

  private async getServiceDeployment(service: string): Promise<{
    status: string | null;
    id: string | null;
    createdAt: string | null;
  }> {
    const raw = await this.runRailway(['status', '--json'], 120000);
    const parsed = JSON.parse(raw);
    const nodes = parsed?.environments?.edges || [];
    for (const env of nodes) {
      const instances = env?.node?.serviceInstances?.edges || [];
      for (const edge of instances) {
        const node = edge?.node;
        if (node?.serviceName === service) {
          return {
            status: node?.latestDeployment?.status ?? null,
            id: node?.latestDeployment?.id ?? null,
            createdAt: node?.latestDeployment?.createdAt ?? null,
          };
        }
      }
    }
    return { status: null, id: null, createdAt: null };
  }

  private async getVars(service: string): Promise<Record<string, string>> {
    const raw = await this.runRailway(['variable', 'list', '--service', service, '--json'], 120000);
    return JSON.parse(raw);
  }

  private async waitForSuccess(
    service: string,
    timeoutSeconds: number
  ): Promise<{
    status: string | null;
    id: string | null;
    createdAt: string | null;
  }> {
    const start = Date.now();
    while (Date.now() - start < timeoutSeconds * 1000) {
      const current = await this.getServiceDeployment(service);
      if (current.status === 'SUCCESS') return current;
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    return this.getServiceDeployment(service);
  }

  private async checkOverview(service: string): Promise<number | null> {
    const vars = await this.getVars(service);
    const domain = vars.RAILWAY_PUBLIC_DOMAIN;
    if (!domain) return null;
    const { stdout } = await execFileAsync(
      'curl',
      ['-sS', '-o', '/dev/null', '-w', '%{http_code}', `https://${domain}/overview`],
      {
        timeout: 30000,
      }
    );
    const code = Number(String(stdout || '').trim());
    return Number.isFinite(code) ? code : null;
  }

  async executeBinding(
    tenantId: string,
    service: string,
    provider: OpenClawProvider,
    opts: { waitForSuccess?: boolean; timeoutSeconds?: number } = {}
  ): Promise<OpenClawOAuthExecutionResult> {
    const key = this.makeKey(tenantId, service, provider);
    const row = await drizzleConfigurationRepository.findConfigByKey(key);
    if (!row) throw new Error(`Binding not found: ${key}`);

    const payload = JSON.parse(this.decrypt(row.value)) as OpenClawOAuthSecretPayload;
    if (payload.deleted) {
      throw new Error(`Binding is deleted: ${key}`);
    }
    if (!payload.accessToken || !payload.refreshToken) {
      throw new Error(`Binding ${key} is missing tokens`);
    }

    const setArgs = ['variables', 'set'];
    if (provider === 'openai-codex') {
      if (!payload.accountId) throw new Error('openai-codex binding missing accountId');
      setArgs.push(
        `OPENAI_CODEX_ACCESS_TOKEN=${payload.accessToken}`,
        `OPENAI_CODEX_REFRESH_TOKEN=${payload.refreshToken}`,
        `OPENAI_CODEX_ACCOUNT_ID=${payload.accountId}`,
        'OPENCLAW_USE_CODEX_OAUTH=true'
      );
    } else if (provider === 'anthropic') {
      setArgs.push(
        `ANTHROPIC_OAUTH_ACCESS_TOKEN=${payload.accessToken}`,
        `ANTHROPIC_OAUTH_REFRESH_TOKEN=${payload.refreshToken}`
      );
    } else if (provider === 'google-antigravity') {
      setArgs.push(
        `GOOGLE_ANTIGRAVITY_ACCESS_TOKEN=${payload.accessToken}`,
        `GOOGLE_ANTIGRAVITY_REFRESH_TOKEN=${payload.refreshToken}`,
        `GOOGLE_ANTIGRAVITY_EMAIL=${payload.googleEmail || ''}`,
        `GOOGLE_ANTIGRAVITY_PROJECT_ID=${payload.googleProjectId || ''}`
      );
    } else if (provider === 'kilo') {
      setArgs.push(
        `KILO_ACCESS_TOKEN=${payload.accessToken}`,
        `KILO_REFRESH_TOKEN=${payload.refreshToken}`
      );
    }

    setArgs.push(
      `OPENCLAW_MODEL_PRIMARY=${payload.primaryModel}`,
      `OPENCLAW_AGENTS__DEFAULTS__MODEL__PRIMARY=${payload.primaryModel}`,
      `OPENCLAW_MODEL_FALLBACKS=${payload.fallbackModels}`,
      '--service',
      payload.service
    );

    await this.runRailway(setArgs, 180000);

    const vars = await this.getVars(payload.service);
    const verified: OpenClawOAuthExecutionResult['verified'] = {
      primaryModel: vars.OPENCLAW_MODEL_PRIMARY || '',
      fallbackModels: vars.OPENCLAW_MODEL_FALLBACKS || '',
    };
    if (provider === 'openai-codex') {
      verified.useCodexOAuth = vars.OPENCLAW_USE_CODEX_OAUTH || '';
      verified.accountId = vars.OPENAI_CODEX_ACCOUNT_ID || '';
    }

    const wait = opts.waitForSuccess ?? true;
    const timeoutSeconds = opts.timeoutSeconds ?? 600;
    const deploy = wait
      ? await this.waitForSuccess(payload.service, timeoutSeconds)
      : await this.getServiceDeployment(payload.service);

    const overviewStatus = await this.checkOverview(payload.service);

    return {
      service: payload.service,
      provider: payload.provider,
      deployStatus: deploy.status,
      deployId: deploy.id,
      deployCreatedAt: deploy.createdAt,
      overviewStatus,
      verified,
    };
  }
}
