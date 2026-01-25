import { Body, Controller, Get, NotFoundException, Param, Put, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../guards/admin.guard';
import { SecureAuthGuard } from '../guards/secure-auth.guard';
import { AuditService } from '../services/audit.service';

interface ConfigItem {
  key: string;
  value: string;
  category: string;
  description: string;
  sensitive: boolean;
  updatedAt: Date;
  updatedBy: string;
}

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
}
