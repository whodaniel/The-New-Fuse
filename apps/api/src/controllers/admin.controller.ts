import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { DatabaseService } from '../services/database';

// Mock Feature Flags (shared with FeatureController)
let FEATURE_FLAGS = [
  {
    id: 'new-ui',
    name: 'New UI Layout',
    description: 'Enable the redesigned user interface',
    enabled: true,
    rolloutPercentage: 100,
  },
  {
    id: 'beta-workflows',
    name: 'Beta Workflow Engine',
    description: 'Access to experimental workflow features',
    enabled: false,
    rolloutPercentage: 0,
  },
  {
    id: 'agent-marketplace',
    name: 'Agent Marketplace',
    description: 'Browsable marketplace for agent skills',
    enabled: true,
    rolloutPercentage: 50,
  },
];

@Controller('admin')
export class AdminController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get('run-script')
  async runScript(@Query('script') script: string) {
    // Mock implementation
    return { success: true, output: `Executed: ${script}` };
  }

  @Get('roles')
  async getRoles() {
    // Mock implementation
    return [
      { id: 'admin', name: 'Administrator', permissions: ['*'] },
      { id: 'user', name: 'User', permissions: ['read'] },
    ];
  }

  @Get('roles/:id/permissions')
  async getRolePermissions(@Param('id') id: string) {
    // Mock implementation
    const roles: Record<string, string[]> = {
      admin: ['*'],
      user: ['read'],
    };
    return roles[id] || [];
  }

  @Get('audit-logs')
  async getAuditLogs(@Query('limit') limit = '100') {
    // Mock implementation
    return [];
  }

  @Get('metrics')
  async getMetrics() {
    // Mock implementation
    return { uptime: process.uptime(), memory: process.memoryUsage() };
  }

  // Feature Flags endpoints (mirrors FeatureController for /api/admin/features)
  @Get('features')
  async getFeatureFlags() {
    return FEATURE_FLAGS;
  }

  @Post('features')
  async createFeatureFlag(
    @Body()
    body: {
      id: string;
      name: string;
      description: string;
      enabled: boolean;
      rolloutPercentage: number;
    }
  ) {
    const { id, name, description, enabled, rolloutPercentage } = body;
    const newFlag = {
      id,
      name,
      description,
      enabled: enabled ?? false,
      rolloutPercentage: rolloutPercentage ?? 0,
    };
    FEATURE_FLAGS.push(newFlag);
    return newFlag;
  }

  @Patch('features/:id')
  async updateFeatureFlag(
    @Param('id') id: string,
    @Body() body: { enabled?: boolean; rolloutPercentage?: number }
  ) {
    const index = FEATURE_FLAGS.findIndex((f) => f.id === id);
    if (index === -1) {
      return { success: false, message: 'Feature flag not found' };
    }
    FEATURE_FLAGS[index] = { ...FEATURE_FLAGS[index], ...body };
    return FEATURE_FLAGS[index];
  }

  @Patch('features/:id/toggle')
  async toggleFeatureFlag(@Param('id') id: string) {
    const index = FEATURE_FLAGS.findIndex((f) => f.id === id);
    if (index === -1) {
      return { success: false, message: 'Feature flag not found' };
    }
    FEATURE_FLAGS[index] = { ...FEATURE_FLAGS[index], enabled: !FEATURE_FLAGS[index].enabled };
    return FEATURE_FLAGS[index];
  }

  @Delete('features/:id')
  async deleteFeatureFlag(@Param('id') id: string) {
    const index = FEATURE_FLAGS.findIndex((f) => f.id === id);
    if (index === -1) {
      return { success: false, message: 'Feature flag not found' };
    }
    FEATURE_FLAGS.splice(index, 1);
    return { success: true };
  }

  // Database endpoints
  @Get('database')
  async getDatabaseStatus() {
    // Return mock database connection status
    return {
      connected: true,
      host: 'localhost',
      port: 5432,
      database: 'tnf',
      version: 'PostgreSQL 15.x',
      tables: ['users', 'workspaces', 'projects', 'audit_logs', 'feature_flags'],
    };
  }

  @Post('database/query')
  async executeQuery(@Body() body: { sql: string; params?: any[] }) {
    const { sql, params } = body;
    // Only allow SELECT queries for safety
    if (!sql.trim().toUpperCase().startsWith('SELECT')) {
      return { success: false, message: 'Only SELECT queries are allowed' };
    }
    try {
      const result = await this.databaseService.query(sql, params);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Query failed' };
    }
  }
}
