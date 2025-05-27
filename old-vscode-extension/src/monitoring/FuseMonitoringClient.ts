import * as vscode from 'vscode';
import { getLogger } from '../core/logging.js';
import { MonitoringClient } from '../types.js';

/**
 * Implementation of the MonitoringClient for The New Fuse extension
 * Collects telemetry data and monitors LLM usage
 */
export class FuseMonitoringClient implements MonitoringClient {
  private readonly logger = getLogger();
  private readonly extensionContext: vscode.ExtensionContext;
  private readonly stats: Record<string, any> = {
    totalEvents: 0,
    totalErrors: 0,
    eventCounts: {},
    lastEvent: null,
    lastError: null
  };
  
  constructor(context: vscode.ExtensionContext) {
    this.extensionContext = context;
    this.logger.debug('FuseMonitoringClient initialized');
  }

  /**
   * Record an event with optional metadata
   */
  public recordEvent(eventName: string, eventData?: Record<string, any>): void {
    try {
      this.stats.totalEvents++;
      
      // Increment event counter
      this.stats.eventCounts[eventName] = (this.stats.eventCounts[eventName] || 0) + 1;
      
      // Store last event
      this.stats.lastEvent = {
        name: eventName,
        timestamp: new Date().toISOString(),
        data: eventData
      };
      
      // Log the event
      this.logger.debug(`Event: ${eventName}`, eventData);
      
      // Update persistent state if configured
      const config = vscode.workspace.getConfiguration('theFuse');
      if (config.get<boolean>('monitoring.persistStats', false)) {
        this.extensionContext.globalState.update('fuse.monitoring.stats', this.stats);
      }
    } catch (error) {
      this.logger.error('Failed to record event', error);
    }
  }

  /**
   * Record an error with optional context
   */
  public recordError(error: Error, context?: string): void {
    try {
      this.stats.totalErrors++;
      
      // Store last error
      this.stats.lastError = {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString()
      };
      
      // Log the error
      this.logger.error(`Error in context: ${context || 'unknown'}`, error);
      
      // Update persistent state if configured
      const config = vscode.workspace.getConfiguration('theFuse');
      if (config.get<boolean>('monitoring.persistStats', false)) {
        this.extensionContext.globalState.update('fuse.monitoring.stats', this.stats);
      }
    } catch (internalError) {
      this.logger.error('Failed to record error', internalError);
    }
  }

  /**
   * Get current monitoring statistics
   */
  public async getStats(): Promise<Record<string, any>> {
    return this.stats;
  }

  /**
   * Reset monitoring statistics
   */
  public async resetStats(): Promise<void> {
    this.stats.totalEvents = 0;
    this.stats.totalErrors = 0;
    this.stats.eventCounts = {};
    this.stats.lastEvent = null;
    this.stats.lastError = null;
    
    // Update persistent state if configured
    const config = vscode.workspace.getConfiguration('theFuse');
    if (config.get<boolean>('monitoring.persistStats', false)) {
      await this.extensionContext.globalState.update('fuse.monitoring.stats', this.stats);
    }
  }

  /**
   * Add a custom stat
   */
  public addCustomStat(key: string, value: any): void {
    this.stats[key] = value;
  }
}

/**
 * Factory function to create a FuseMonitoringClient instance
 */
export function createFuseMonitoringClient(context: vscode.ExtensionContext): MonitoringClient {
  return new FuseMonitoringClient(context);
}