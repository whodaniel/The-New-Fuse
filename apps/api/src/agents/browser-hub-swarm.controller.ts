/**
 * Browser Hub Swarm Controller
 *
 * REST API for controlling the Browser Hub Improvement Agent Swarm.
 */

import { Body, Controller, Get, Logger, Post } from '@nestjs/common';
import { AuthLevel, RequireAuthLevel } from '../guards/secure-auth.guard.js';
import { BrowserHubSwarmService } from './browser-hub-swarm.service.js';

@Controller('agents/browser-hub-swarm')
@RequireAuthLevel(AuthLevel.USER)
export class BrowserHubSwarmController {
  private readonly logger = new Logger(BrowserHubSwarmController.name);

  constructor(private readonly swarmService: BrowserHubSwarmService) {}

  /**
   * Get current swarm status
   */
  @Get('status')
  getStatus() {
    return this.swarmService.getStatus();
  }

  /**
   * Load the Browser Hub codebase for analysis
   */
  @Post('load-codebase')
  async loadCodebase(@Body() body: { path?: string }) {
    const basePath =
      body.path || '/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/electron-desktop/src';
    await this.swarmService.loadCodebase(basePath);
    return {
      success: true,
      message: 'Codebase loaded',
      path: basePath,
    };
  }

  /**
   * Run a single iteration of all agents
   */
  @Post('iterate')
  async runIteration() {
    this.logger.log('Running single iteration...');
    const status = await this.swarmService.runIteration();
    return status;
  }

  /**
   * Run until target score achieved or max iterations
   */
  @Post('run-complete')
  async runUntilComplete() {
    this.logger.log('Starting complete improvement campaign...');
    const status = await this.swarmService.runUntilComplete();
    return status;
  }

  /**
   * Get all issues from all agents
   */
  @Get('issues')
  getAllIssues() {
    const issues = this.swarmService.getAllIssues();
    return {
      total: issues.length,
      critical: issues.filter((i) => i.severity === 'critical').length,
      major: issues.filter((i) => i.severity === 'major').length,
      minor: issues.filter((i) => i.severity === 'minor').length,
      issues,
    };
  }

  /**
   * Get all suggestions
   */
  @Get('suggestions')
  getAllSuggestions() {
    return {
      suggestions: this.swarmService.getAllSuggestions(),
    };
  }

  /**
   * Generate comprehensive improvement plan
   */
  @Get('improvement-plan')
  getImprovementPlan() {
    return this.swarmService.generateImprovementPlan();
  }

  /**
   * Run demo analysis of Browser Hub
   */
  @Post('demo')
  async runDemo() {
    this.logger.log('🚀 Starting Browser Hub Swarm Demo...');

    // Load the codebase
    const basePath = '/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/electron-desktop/src';
    await this.swarmService.loadCodebase(basePath);

    // Run one iteration
    const status = await this.swarmService.runIteration();

    // Generate improvement plan
    const plan = this.swarmService.generateImprovementPlan();

    return {
      message: 'Browser Hub Swarm Demo Complete',
      status,
      improvementPlan: plan,
      issues: this.swarmService.getAllIssues(),
      suggestions: this.swarmService.getAllSuggestions(),
    };
  }
}
