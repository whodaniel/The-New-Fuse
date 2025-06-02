import { PerformanceMetrics, OptimizationSettings, HealthCheckResult } from '../types';
import { Logger } from './logger';
import { settingsManager } from './settings-manager';

/**
 * Smart Performance Optimizer
 * Automatically optimizes extension performance based on usage patterns and system resources
 */
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private logger: Logger;
  private metrics: PerformanceMetrics;
  private optimizationHistory: Array<{
    timestamp: Date;
    action: string;
    impact: number;
    success: boolean;
  }> = [];
  private monitoringInterval?: number;
  private isOptimizing = false;

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  private constructor() {
    this.logger = new Logger({ name: 'PerformanceOptimizer', saveToStorage: true });
    this.metrics = this.getInitialMetrics();
    this.initialize();
  }

  private getInitialMetrics(): PerformanceMetrics {
    return {
      cpuUsage: 0,
      memoryUsage: 0,
      networkLatency: 0,
      domOperations: 0,
      renderTime: 0,
      scriptExecutionTime: 0,
      pageLoadTime: 0
    };
  }

  private async initialize() {
    if (settingsManager.isFeatureEnabled('performance-monitoring')) {
      this.startMonitoring();
    }

    // Listen for feature toggles
    settingsManager.addEventListener('feature-toggled', (data: any) => {
      if (data.featureId === 'performance-monitoring') {
        if (data.enabled) {
          this.startMonitoring();
        } else {
          this.stopMonitoring();
        }
      }
    });

    this.logger.info('Performance optimizer initialized');
  }

  private startMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = window.setInterval(async () => {
      await this.collectMetrics();
      await this.analyzeAndOptimize();
    }, 30000); // Check every 30 seconds

    this.logger.info('Performance monitoring started');
  }

  private stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.logger.info('Performance monitoring stopped');
  }

  private async collectMetrics(): Promise<void> {
    try {
      const memoryInfo = this.getMemoryInfo();
      const performanceEntries = this.getPerformanceEntries();
      const networkStats = await this.getNetworkStats();

      this.metrics = {
        cpuUsage: this.estimateCPUUsage(),
        memoryUsage: memoryInfo.used,
        networkLatency: networkStats.latency,
        domOperations: this.countDOMOperations(),
        renderTime: performanceEntries.renderTime,
        scriptExecutionTime: performanceEntries.scriptTime,
        pageLoadTime: performanceEntries.loadTime
      };

      // Store metrics for trend analysis
      await this.storeMetrics();

    } catch (error) {
      this.logger.error('Failed to collect performance metrics', error);
    }
  }

  private getMemoryInfo(): { used: number; total: number } {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize || 0,
        total: memory.totalJSHeapSize || 0
      };
    }
    return { used: 0, total: 0 };
  }

  private getPerformanceEntries(): {
    renderTime: number;
    scriptTime: number;
    loadTime: number;
  } {
    const entries = performance.getEntriesByType('measure');
    let renderTime = 0;
    let scriptTime = 0;
    let loadTime = 0;

    entries.forEach(entry => {
      if (entry.name.includes('render')) {
        renderTime += entry.duration;
      } else if (entry.name.includes('script')) {
        scriptTime += entry.duration;
      }
    });

    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navigationEntries.length > 0) {
      const nav = navigationEntries[0];
      loadTime = nav.loadEventEnd - nav.navigationStart;
    }

    return { renderTime, scriptTime, loadTime };
  }

  private async getNetworkStats(): Promise<{ latency: number }> {
    try {
      const start = performance.now();
      await fetch(chrome.runtime.getURL('manifest.json'), { cache: 'no-cache' });
      const latency = performance.now() - start;
      return { latency };
    } catch (error) {
      return { latency: 0 };
    }
  }

  private estimateCPUUsage(): number {
    // Simple CPU usage estimation based on script execution time
    const entries = performance.getEntriesByType('measure');
    const totalTime = entries.reduce((sum, entry) => sum + entry.duration, 0);
    return Math.min(totalTime / 1000, 100); // Normalize to percentage
  }

  private countDOMOperations(): number {
    // Count recent DOM mutations (simplified)
    const observer = new MutationObserver(() => {});
    const config = { childList: true, subtree: true, attributes: true };
    
    let mutations = 0;
    const tempObserver = new MutationObserver((mutationsList) => {
      mutations = mutationsList.length;
    });

    tempObserver.observe(document.body, config);
    
    setTimeout(() => {
      tempObserver.disconnect();
    }, 1000);

    return mutations;
  }

  private async storeMetrics(): Promise<void> {
    try {
      const timestamp = Date.now();
      const metricsHistory = await this.getStoredMetrics();
      
      metricsHistory.push({
        timestamp,
        metrics: { ...this.metrics }
      });

      // Keep only last 100 entries
      if (metricsHistory.length > 100) {
        metricsHistory.splice(0, metricsHistory.length - 100);
      }

      await chrome.storage.local.set({ performanceMetrics: metricsHistory });
    } catch (error) {
      this.logger.error('Failed to store performance metrics', error);
    }
  }

  private async getStoredMetrics(): Promise<Array<{ timestamp: number; metrics: PerformanceMetrics }>> {
    try {
      const result = await chrome.storage.local.get(['performanceMetrics']);
      return result.performanceMetrics || [];
    } catch (error) {
      this.logger.error('Failed to get stored metrics', error);
      return [];
    }
  }

  private async analyzeAndOptimize(): Promise<void> {
    if (this.isOptimizing || !settingsManager.isFeatureEnabled('auto-optimization')) {
      return;
    }

    this.isOptimizing = true;

    try {
      const optimizations = await this.generateOptimizations();
      
      for (const optimization of optimizations) {
        await this.applyOptimization(optimization);
      }

    } catch (error) {
      this.logger.error('Error during optimization analysis', error);
    } finally {
      this.isOptimizing = false;
    }
  }

  private async generateOptimizations(): Promise<Array<{
    type: 'setting' | 'feature';
    target: string;
    action: 'enable' | 'disable' | 'adjust';
    value?: any;
    reason: string;
    priority: number;
  }>> {
    const optimizations = [];
    const settings = settingsManager.getOptimizationSettings();

    // High memory usage optimizations
    if (this.metrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
      if (!settings.intelligentCaching) {
        optimizations.push({
          type: 'setting',
          target: 'intelligentCaching',
          action: 'enable',
          reason: 'High memory usage detected',
          priority: 8
        });
      }

      if (!settings.limitBackgroundProcessing) {
        optimizations.push({
          type: 'setting',
          target: 'limitBackgroundProcessing',
          action: 'enable',
          reason: 'Reduce memory footprint',
          priority: 7
        });
      }
    }

    // High CPU usage optimizations
    if (this.metrics.cpuUsage > 50) {
      if (!settings.batchDOMOperations) {
        optimizations.push({
          type: 'setting',
          target: 'batchDOMOperations',
          action: 'enable',
          reason: 'High CPU usage detected',
          priority: 9
        });
      }
    }

    // Network latency optimizations
    if (this.metrics.networkLatency > 1000) { // 1 second
      if (settings.compressionLevel === 'none') {
        optimizations.push({
          type: 'setting',
          target: 'compressionLevel',
          action: 'adjust',
          value: 'medium',
          reason: 'High network latency detected',
          priority: 6
        });
      }
    }

    // Sort by priority (highest first)
    return optimizations.sort((a, b) => b.priority - a.priority);
  }

  private async applyOptimization(optimization: any): Promise<void> {
    try {
      const startMetrics = { ...this.metrics };

      if (optimization.type === 'setting') {
        const currentSettings = settingsManager.getOptimizationSettings();
        const updates: any = {};
        
        if (optimization.action === 'enable') {
          updates[optimization.target] = true;
        } else if (optimization.action === 'disable') {
          updates[optimization.target] = false;
        } else if (optimization.action === 'adjust' && optimization.value !== undefined) {
          updates[optimization.target] = optimization.value;
        }

        await settingsManager.updateOptimizationSettings(updates);
        
        this.logger.info(`Applied optimization: ${optimization.action} ${optimization.target}`, {
          reason: optimization.reason,
          priority: optimization.priority
        });

        // Record optimization history
        this.optimizationHistory.push({
          timestamp: new Date(),
          action: `${optimization.action} ${optimization.target}`,
          impact: optimization.priority,
          success: true
        });

        // Wait and measure impact
        setTimeout(async () => {
          await this.collectMetrics();
          const improvement = this.calculateImprovement(startMetrics, this.metrics);
          this.logger.info(`Optimization impact measured`, { improvement });
        }, 10000); // Wait 10 seconds

      } else if (optimization.type === 'feature') {
        const success = await settingsManager.toggleFeature(
          optimization.target,
          optimization.action === 'enable'
        );

        if (success) {
          this.logger.info(`Applied feature optimization: ${optimization.action} ${optimization.target}`);
        }
      }

    } catch (error) {
      this.logger.error(`Failed to apply optimization: ${optimization.target}`, error);
      
      this.optimizationHistory.push({
        timestamp: new Date(),
        action: `${optimization.action} ${optimization.target}`,
        impact: optimization.priority,
        success: false
      });
    }
  }

  private calculateImprovement(before: PerformanceMetrics, after: PerformanceMetrics): number {
    const weightedScore = (metrics: PerformanceMetrics) => {
      return (
        (metrics.memoryUsage / 1024 / 1024) * 0.3 + // Weight memory usage
        metrics.cpuUsage * 0.3 + // Weight CPU usage
        (metrics.networkLatency / 1000) * 0.2 + // Weight network latency
        (metrics.renderTime / 100) * 0.2 // Weight render time
      );
    };

    const beforeScore = weightedScore(before);
    const afterScore = weightedScore(after);
    
    return ((beforeScore - afterScore) / beforeScore) * 100; // Percentage improvement
  }

  // Public API
  async performHealthCheck(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    // Memory health
    const memoryMB = this.metrics.memoryUsage / 1024 / 1024;
    results.push({
      component: 'Memory Usage',
      status: memoryMB > 100 ? 'error' : memoryMB > 50 ? 'warning' : 'healthy',
      message: `${memoryMB.toFixed(1)}MB used`,
      timestamp: new Date()
    });

    // CPU health
    results.push({
      component: 'CPU Usage',
      status: this.metrics.cpuUsage > 80 ? 'error' : this.metrics.cpuUsage > 50 ? 'warning' : 'healthy',
      message: `${this.metrics.cpuUsage.toFixed(1)}% usage`,
      timestamp: new Date()
    });

    // Network health
    results.push({
      component: 'Network Latency',
      status: this.metrics.networkLatency > 2000 ? 'error' : this.metrics.networkLatency > 1000 ? 'warning' : 'healthy',
      message: `${this.metrics.networkLatency.toFixed(0)}ms latency`,
      timestamp: new Date()
    });

    return results;
  }

  getCurrentMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getOptimizationHistory(): typeof this.optimizationHistory {
    return [...this.optimizationHistory];
  }

  async forceOptimization(): Promise<void> {
    await this.analyzeAndOptimize();
  }

  async clearOptimizationHistory(): Promise<void> {
    this.optimizationHistory = [];
    await chrome.storage.local.remove(['performanceMetrics']);
    this.logger.info('Optimization history cleared');
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();
