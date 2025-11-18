import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';

// Admin guard to protect routes (implement based on your auth system)
// @UseGuards(AdminGuard)
@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // User Management
  @Get('users')
  async getUsers(@Query() filters: any) {
    return this.adminService.getUsers(filters);
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Post('users')
  async createUser(@Body() userData: any) {
    return this.adminService.createUser(userData);
  }

  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() userData: any) {
    return this.adminService.updateUser(id, userData);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Post('users/bulk-action')
  async bulkUserAction(@Body() data: { action: string; userIds: string[] }) {
    return this.adminService.bulkUserAction(data.action, data.userIds);
  }

  // System Metrics
  @Get('metrics/system')
  async getSystemMetrics(@Query('range') range: string) {
    return this.adminService.getSystemMetrics(range);
  }

  @Get('metrics/performance')
  async getPerformanceMetrics(@Query('range') range: string) {
    return this.adminService.getPerformanceMetrics(range);
  }

  @Get('metrics/api')
  async getAPIMetrics(@Query('range') range: string) {
    return this.adminService.getAPIMetrics(range);
  }

  // Agent Management
  @Get('agents')
  async getAgents() {
    return this.adminService.getAgents();
  }

  @Get('agents/:id')
  async getAgent(@Param('id') id: string) {
    return this.adminService.getAgent(id);
  }

  @Post('agents/:id/start')
  async startAgent(@Param('id') id: string) {
    return this.adminService.startAgent(id);
  }

  @Post('agents/:id/stop')
  async stopAgent(@Param('id') id: string) {
    return this.adminService.stopAgent(id);
  }

  @Post('agents/:id/restart')
  async restartAgent(@Param('id') id: string) {
    return this.adminService.restartAgent(id);
  }

  @Delete('agents/:id')
  async deleteAgent(@Param('id') id: string) {
    return this.adminService.deleteAgent(id);
  }

  @Get('agents/:id/performance')
  async getAgentPerformance(@Param('id') id: string, @Query('range') range: string) {
    return this.adminService.getAgentPerformance(id, range);
  }

  // Database Admin
  @Post('database/query')
  async executeQuery(@Body() data: { query: string }) {
    return this.adminService.executeQuery(data.query);
  }

  @Get('database/tables')
  async getDatabaseTables() {
    return this.adminService.getDatabaseTables();
  }

  @Get('database/table/:name')
  async getTableInfo(@Param('name') name: string) {
    return this.adminService.getTableInfo(name);
  }

  @Get('database/health')
  async getDatabaseHealth() {
    return this.adminService.getDatabaseHealth();
  }

  @Post('database/export')
  async exportDatabase(@Body() data: { tables: string[] }) {
    return this.adminService.exportDatabase(data.tables);
  }

  @Post('database/import')
  async importDatabase(@Body() data: { file: string }) {
    return this.adminService.importDatabase(data.file);
  }

  // API Analytics
  @Get('analytics/api/overview')
  async getAPIAnalyticsOverview(@Query('range') range: string) {
    return this.adminService.getAPIAnalyticsOverview(range);
  }

  @Get('analytics/api/endpoints')
  async getTopEndpoints(@Query('range') range: string) {
    return this.adminService.getTopEndpoints(range);
  }

  @Get('analytics/api/status-codes')
  async getStatusCodeDistribution(@Query('range') range: string) {
    return this.adminService.getStatusCodeDistribution(range);
  }

  @Get('analytics/api/methods')
  async getMethodDistribution(@Query('range') range: string) {
    return this.adminService.getMethodDistribution(range);
  }

  // Configuration Management
  @Get('config')
  async getConfigurations(@Query('category') category?: string) {
    return this.adminService.getConfigurations(category);
  }

  @Get('config/:key')
  async getConfiguration(@Param('key') key: string) {
    return this.adminService.getConfiguration(key);
  }

  @Put('config/:key')
  async updateConfiguration(@Param('key') key: string, @Body() data: { value: string }) {
    return this.adminService.updateConfiguration(key, data.value);
  }

  @Post('config')
  async createConfiguration(@Body() data: { key: string; value: string; category: string; description: string }) {
    return this.adminService.createConfiguration(data);
  }

  @Delete('config/:key')
  async deleteConfiguration(@Param('key') key: string) {
    return this.adminService.deleteConfiguration(key);
  }

  @Post('config/export')
  async exportConfigurations() {
    return this.adminService.exportConfigurations();
  }

  @Post('config/import')
  async importConfigurations(@Body() data: any) {
    return this.adminService.importConfigurations(data);
  }

  // Audit Logs
  @Get('audit-logs')
  async getAuditLogs(@Query() filters: any) {
    return this.adminService.getAuditLogs(filters);
  }

  @Get('audit-logs/:id')
  async getAuditLog(@Param('id') id: string) {
    return this.adminService.getAuditLog(id);
  }

  @Post('audit-logs/export')
  async exportAuditLogs(@Body() filters: any) {
    return this.adminService.exportAuditLogs(filters);
  }

  // Backup & Restore
  @Get('backups')
  async getBackups() {
    return this.adminService.getBackups();
  }

  @Post('backups/create')
  async createBackup(@Body() data: { type: 'full' | 'incremental'; name?: string }) {
    return this.adminService.createBackup(data.type, data.name);
  }

  @Post('backups/:id/restore')
  async restoreBackup(@Param('id') id: string) {
    return this.adminService.restoreBackup(id);
  }

  @Delete('backups/:id')
  async deleteBackup(@Param('id') id: string) {
    return this.adminService.deleteBackup(id);
  }

  @Get('backups/schedules')
  async getBackupSchedules() {
    return this.adminService.getBackupSchedules();
  }

  @Post('backups/schedules')
  async createBackupSchedule(@Body() scheduleData: any) {
    return this.adminService.createBackupSchedule(scheduleData);
  }

  @Put('backups/schedules/:id')
  async updateBackupSchedule(@Param('id') id: string, @Body() scheduleData: any) {
    return this.adminService.updateBackupSchedule(id, scheduleData);
  }

  @Delete('backups/schedules/:id')
  async deleteBackupSchedule(@Param('id') id: string) {
    return this.adminService.deleteBackupSchedule(id);
  }

  // Feature Flags
  @Get('feature-flags')
  async getFeatureFlags() {
    return this.adminService.getFeatureFlags();
  }

  @Put('feature-flags/:name')
  async updateFeatureFlag(@Param('name') name: string, @Body() data: { enabled: boolean }) {
    return this.adminService.updateFeatureFlag(name, data.enabled);
  }

  @Post('feature-flags')
  async createFeatureFlag(@Body() data: any) {
    return this.adminService.createFeatureFlag(data);
  }

  // Dashboard Stats
  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('dashboard/recent-activity')
  async getRecentActivity(@Query('limit') limit: number = 10) {
    return this.adminService.getRecentActivity(limit);
  }

  @Get('dashboard/alerts')
  async getSystemAlerts() {
    return this.adminService.getSystemAlerts();
  }

  // System Health
  @Get('health/status')
  async getHealthStatus() {
    return this.adminService.getHealthStatus();
  }

  @Get('health/services')
  async getServicesHealth() {
    return this.adminService.getServicesHealth();
  }
}
