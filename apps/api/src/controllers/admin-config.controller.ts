// @ts-nocheck
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  drizzleAgentRepository,
  drizzleConfigurationRepository,
  drizzleLLMConfigRepository,
} from '@the-new-fuse/database/drizzle/repositories';
import { AdminGuard } from '../guards/admin.guard.js';
import { SecureAuthGuard } from '../guards/secure-auth.guard.js';
import { AuditService } from '../services/audit.service.js';

interface ConfigItem {
  key: string;
  value: string;
  category: string;
  description: string;
  sensitive: boolean;
  updatedAt: Date;
  updatedBy: string;
}

interface LLMRoutingSelection {
  provider: string;
  model: string;
}

interface LLMRoutingAgentConfig {
  primary: LLMRoutingSelection;
  fallback: LLMRoutingSelection;
  enabled: boolean;
}

interface LLMRoutingConfig {
  version: number;
  updatedAt: string;
  global: {
    primary: LLMRoutingSelection;
    fallback: LLMRoutingSelection;
  };
  agents: Record<string, LLMRoutingAgentConfig>;
}

interface LLMRoutingOptions {
  providers: Array<{ provider: string; models: string[] }>;
  targets: string[];
}

const LLM_ROUTING_KEY = 'TNF_LLM_ROUTING_V1';
const DEFAULT_ROUTING_TARGETS = [
  'TheNewFuse',
  'api',
  'api-gateway',
  'ai-arcade',
  'backend',
  'clawdbot-railway-template',
  'fuse-theia-ide',
  'openclaw-cloud',
  'openclaw-primary',
  'openclaw-sandbox-cloud',
  'picoclaw-perplexity',
  'picoclaw-subject',
  'picoclaw-tester',
  'picoclaw-tester-v2',
  'Postgres',
  'Redis',
  'relay-server',
  'tnf-cloud-sandbox',
  'tnf-cloud-sandbox-v2',
  'zeroclaw-sandbox',
  'Frontend Application',
];

/**
 * Admin Configuration Controller
 *
 * Manages system configuration and environment variables.
 * All endpoints require SUPER_ADMIN access.
 * Sensitive values are always masked in responses.
 */
@ApiTags('admin-config')
@Controller('admin/config')
@UseGuards(SecureAuthGuard, AdminGuard)
export class AdminConfigController {
  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: AuditService
  ) {}

  /**
   * Get all configuration items (with sensitive values masked)
   */
  @Get()
  @ApiOperation({ summary: 'Get all configuration items' })
  @ApiResponse({ status: 200, description: 'List of configuration items' })
  async getAllConfig(): Promise<ConfigItem[]> {
    // Define configuration structure
    // In production, this would come from a database table
    const configs: ConfigItem[] = [
      {
        key: 'MAX_UPLOAD_SIZE',
        value: this.configService.get<string>('MAX_UPLOAD_SIZE') || '10485760',
        category: 'Application',
        description: 'Maximum file upload size in bytes',
        sensitive: false,
        updatedAt: new Date(),
        updatedBy: 'system',
      },
      {
        key: 'SESSION_TIMEOUT',
        value: this.configService.get<string>('SESSION_TIMEOUT') || '3600',
        category: 'Security',
        description: 'Session timeout in seconds',
        sensitive: false,
        updatedAt: new Date(),
        updatedBy: 'system',
      },
      {
        key: 'API_RATE_LIMIT',
        value: this.configService.get<string>('API_RATE_LIMIT') || '1000',
        category: 'API',
        description: 'API rate limit per hour',
        sensitive: false,
        updatedAt: new Date(),
        updatedBy: 'system',
      },
      {
        key: 'DATABASE_URL',
        value: this.maskSensitiveValue(this.configService.get<string>('DATABASE_URL') || ''),
        category: 'Database',
        description: 'Primary database connection string',
        sensitive: true,
        updatedAt: new Date(),
        updatedBy: 'system',
      },
      {
        key: 'REDIS_URL',
        value: this.maskSensitiveValue(this.configService.get<string>('REDIS_URL') || ''),
        category: 'Cache',
        description: 'Redis cache connection string',
        sensitive: true,
        updatedAt: new Date(),
        updatedBy: 'system',
      },
      {
        key: 'JWT_SECRET',
        value: '••••••••••••••••',
        category: 'Security',
        description: 'JWT signing secret',
        sensitive: true,
        updatedAt: new Date(),
        updatedBy: 'system',
      },
    ];

    return configs;
  }

  /**
   * Get configuration item by key (sensitive values masked)
   */
  @Get(':key')
  @ApiOperation({ summary: 'Get configuration by key' })
  @ApiResponse({ status: 200, description: 'Configuration item' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async getConfigByKey(@Param('key') key: string): Promise<ConfigItem> {
    const value = this.configService.get<string>(key);

    if (value === undefined) {
      throw new NotFoundException(`Configuration key '${key}' not found`);
    }

    // Determine if this is a sensitive key
    const sensitiveKeys = [
      'DATABASE_URL',
      'REDIS_URL',
      'JWT_SECRET',
      'API_KEY',
      'SECRET',
      'PASSWORD',
      'TOKEN',
    ];

    const isSensitive = sensitiveKeys.some((sensitive) => key.toUpperCase().includes(sensitive));

    return {
      key,
      value: isSensitive ? this.maskSensitiveValue(value) : value,
      category: this.getCategoryForKey(key),
      description: `Configuration for ${key}`,
      sensitive: isSensitive,
      updatedAt: new Date(),
      updatedBy: 'system',
    };
  }

  /**
   * Update configuration item
   * WARNING: This is a dangerous operation that modifies environment variables
   */
  @Put(':key')
  @ApiOperation({ summary: 'Update configuration item' })
  @ApiResponse({ status: 200, description: 'Configuration updated' })
  async updateConfig(
    @Param('key') key: string,
    @Body() updateData: { value: string }
  ): Promise<ConfigItem> {
    // In production, this would update environment variables or database
    // For now, we just audit log the attempt

    await this.auditService.log('config.updated', {
      resourceType: 'configuration',
      resourceId: key,
      details: {
        key,
        // Never log the actual value for sensitive keys
        valueUpdated: true,
      },
      status: 'success',
    });

    return {
      key,
      value: this.maskSensitiveValue(updateData.value),
      category: this.getCategoryForKey(key),
      description: `Configuration for ${key}`,
      sensitive: true,
      updatedAt: new Date(),
      updatedBy: 'admin',
    };
  }

  @Get('llm-routing/options')
  @ApiOperation({ summary: 'Get provider/model options and known admin routing targets' })
  @ApiResponse({ status: 200, description: 'Routing options for super admin control panel' })
  async getLlmRoutingOptions(): Promise<LLMRoutingOptions> {
    const enabledProviders = await drizzleLLMConfigRepository.findEnabled();
    const byProvider = new Map<string, Set<string>>();

    for (const item of enabledProviders) {
      if (!byProvider.has(item.provider)) byProvider.set(item.provider, new Set<string>());
      byProvider.get(item.provider)!.add(item.modelName);
    }

    const providers = Array.from(byProvider.entries())
      .map(([provider, models]) => ({
        provider,
        models: Array.from(models).sort((a, b) => a.localeCompare(b)),
      }))
      .sort((a, b) => a.provider.localeCompare(b.provider));

    const systemAgents = await drizzleAgentRepository.findAllSystem(1, 250);
    const dynamicTargets = systemAgents.data
      .map((agent: any) => agent.name?.trim())
      .filter((name): name is string => Boolean(name));

    const targets = Array.from(new Set([...DEFAULT_ROUTING_TARGETS, ...dynamicTargets])).sort(
      (a, b) => a.localeCompare(b)
    );

    return { providers, targets };
  }

  @Get('llm-routing')
  @ApiOperation({ summary: 'Get centralized LLM routing config' })
  @ApiResponse({ status: 200, description: 'Current global and per-agent LLM routing' })
  async getLlmRoutingConfig(): Promise<LLMRoutingConfig> {
    const stored = await drizzleConfigurationRepository.findConfigByKey(LLM_ROUTING_KEY);
    if (!stored?.value) {
      return this.defaultLlmRoutingConfig();
    }

    try {
      return this.normalizeLlmRoutingConfig(JSON.parse(stored.value));
    } catch {
      return this.defaultLlmRoutingConfig();
    }
  }

  @Put('llm-routing')
  @ApiOperation({ summary: 'Update centralized LLM routing config' })
  @ApiResponse({ status: 200, description: 'Updated LLM routing config' })
  async updateLlmRoutingConfig(
    @Body() payload: Partial<LLMRoutingConfig>
  ): Promise<LLMRoutingConfig> {
    if (!payload || typeof payload !== 'object') {
      throw new BadRequestException('Invalid payload');
    }

    const normalized = this.normalizeLlmRoutingConfig(payload);
    await drizzleConfigurationRepository.updateConfig(
      LLM_ROUTING_KEY,
      JSON.stringify(normalized),
      'admin-config-controller'
    );

    await this.auditService.log('llm.routing.updated', {
      resourceType: 'configuration',
      resourceId: LLM_ROUTING_KEY,
      details: {
        agentsConfigured: Object.keys(normalized.agents).length,
        globalPrimaryProvider: normalized.global.primary.provider,
        globalFallbackProvider: normalized.global.fallback.provider,
      },
      status: 'success',
    });

    return normalized;
  }

  @Get('llm-routing/effective/:target')
  @ApiOperation({ summary: 'Get effective LLM routing for a target service/agent' })
  @ApiResponse({ status: 200, description: 'Resolved routing (override if enabled, else global)' })
  async getEffectiveLlmRouting(@Param('target') target: string): Promise<{
    target: string;
    source: 'global' | 'agent-override';
    primary: LLMRoutingSelection;
    fallback: LLMRoutingSelection;
  }> {
    const config = await this.getLlmRoutingConfig();
    const entry = config.agents[target];

    if (entry?.enabled) {
      return {
        target,
        source: 'agent-override',
        primary: entry.primary,
        fallback: entry.fallback,
      };
    }

    return {
      target,
      source: 'global',
      primary: config.global.primary,
      fallback: config.global.fallback,
    };
  }

  /**
   * Mask sensitive configuration values
   */
  private maskSensitiveValue(value: string): string {
    if (!value || value.length === 0) return '••••••••';

    // For URLs, show protocol and host but mask credentials
    if (value.startsWith('postgresql://') || value.startsWith('redis://')) {
      // Extract protocol
      const protocolEnd = value.indexOf('://');
      if (protocolEnd === -1) return '••••••••••••••••';

      const protocol = value.substring(0, protocolEnd + 3);

      // Find the @ symbol which separates credentials from host
      const atIndex = value.indexOf('@');
      if (atIndex === -1) {
        // No credentials in URL
        return value;
      }

      // Extract host part
      const hostPart = value.substring(atIndex + 1);

      return `${protocol}••••••:••••••@${hostPart}`;
    }

    // For other sensitive values, show first and last 4 characters
    if (value.length <= 8) {
      return '••••••••';
    }

    return `${value.substring(0, 4)}${'•'.repeat(value.length - 8)}${value.substring(value.length - 4)}`;
  }

  /**
   * Get category for a configuration key
   */
  private getCategoryForKey(key: string): string {
    const keyUpper = key.toUpperCase();

    if (keyUpper.includes('DATABASE') || keyUpper.includes('DB')) return 'Database';
    if (keyUpper.includes('REDIS') || keyUpper.includes('CACHE')) return 'Cache';
    if (keyUpper.includes('JWT') || keyUpper.includes('AUTH') || keyUpper.includes('SESSION'))
      return 'Security';
    if (keyUpper.includes('API')) return 'API';
    if (keyUpper.includes('EMAIL') || keyUpper.includes('SMTP')) return 'Email';

    return 'Application';
  }

  private defaultLlmRoutingConfig(): LLMRoutingConfig {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      global: {
        primary: { provider: '', model: '' },
        fallback: { provider: '', model: '' },
      },
      agents: {},
    };
  }

  private normalizeLlmRoutingConfig(input: any): LLMRoutingConfig {
    const fallback = this.defaultLlmRoutingConfig();
    const output: LLMRoutingConfig = {
      version: 1,
      updatedAt: new Date().toISOString(),
      global: {
        primary: this.normalizeSelection(input?.global?.primary),
        fallback: this.normalizeSelection(input?.global?.fallback),
      },
      agents: {},
    };

    const rawAgents = input?.agents && typeof input.agents === 'object' ? input.agents : {};
    for (const [target, config] of Object.entries(rawAgents)) {
      if (!target || typeof target !== 'string') continue;
      output.agents[target] = {
        enabled: Boolean((config as any)?.enabled ?? true),
        primary: this.normalizeSelection((config as any)?.primary),
        fallback: this.normalizeSelection((config as any)?.fallback),
      };
    }

    // Keep at least one valid shape.
    if (
      !output.global.primary.provider &&
      !output.global.fallback.provider &&
      !Object.keys(output.agents).length
    ) {
      return fallback;
    }

    return output;
  }

  private normalizeSelection(selection: any): LLMRoutingSelection {
    return {
      provider: typeof selection?.provider === 'string' ? selection.provider.trim() : '',
      model: typeof selection?.model === 'string' ? selection.model.trim() : '',
    };
  }
}
