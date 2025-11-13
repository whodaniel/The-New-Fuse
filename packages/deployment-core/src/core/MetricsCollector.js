"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsCollector = void 0;
/**
 * Metrics Collector gathers and analyzes pipeline performance metrics
 */
class MetricsCollector {
    logger;
    metrics = new Map();
    pipelineHistory = [];
    buildHistory = [];
    deploymentHistory = [];
    infrastructureMetrics = new Map();
    constructor(logger) {
        this.logger = logger;
    }
    /**
     * Record pipeline execution metrics
     */
    recordPipelineMetrics(result) {
        this.logger.debug(`Recording pipeline metrics: ${result.id}, {
      pipelineId: result.pipelineId,
      status: result.status,
      duration: result.duration
    });

    // Store in history
    this.pipelineHistory.push(result);
    
    // Keep only recent history (last 1000 executions)
    if (this.pipelineHistory.length > 1000) {
      this.pipelineHistory = this.pipelineHistory.slice(-1000);
    }

    // Update aggregated metrics
    this.updatePipelineAggregates(result);
    
    // Record individual metrics
    this.recordMetric('pipeline_duration', result.duration || 0, {
      pipelineId: result.pipelineId,
      status: result.status,
      environment: result.environment
    });

    this.recordMetric('pipeline_success_rate', result.status === 'success' ? 1 : 0, {
      pipelineId: result.pipelineId,
      environment: result.environment
    });

    this.recordMetric('stage_count', result.stages.length, {
      pipelineId: result.pipelineId
    });

    // Record stage-specific metrics
    result.stages.forEach(stage => {
      this.recordMetric('stage_duration', stage.duration || 0, {
        pipelineId: result.pipelineId,
        stageName: stage.name,
        stageType: stage.name.toLowerCase().includes('test') ? 'test' : 
                   stage.name.toLowerCase().includes('build') ? 'build' :
                   stage.name.toLowerCase().includes('deploy') ? 'deploy' : 'other'
      });
    });
  }

  /**
   * Record build metrics
   */
  recordBuildMetrics(result: BuildResult): void {`, this.logger.debug(`Recording build metrics: ${result.id}`, {
            triggerId: result.triggerId,
            status: result.status,
            duration: result.duration
        }));
        // Store in history
        this.buildHistory.push(result);
        // Keep only recent history
        if (this.buildHistory.length > 1000) {
            this.buildHistory = this.buildHistory.slice(-1000);
        }
        // Record metrics
        this.recordMetric('build_duration', result.duration || 0, {
            status: result.status
        });
        this.recordMetric('build_success_rate', result.status === 'success' ? 1 : 0);
        if (result.metrics) {
            this.recordMetric('build_artifact_size', result.metrics.artifactSize, {
                status: result.status
            });
            if (result.metrics.testCoverage) {
                this.recordMetric('test_coverage', result.metrics.testCoverage, {
                    buildId: result.id
                });
            }
            if (result.metrics.codeQualityScore) {
                this.recordMetric('code_quality_score', result.metrics.codeQualityScore, {
                    buildId: result.id
                });
            }
        }
    }
    /**
     * Record deployment metrics
     */
    recordDeploymentMetrics(result) {
        this.logger.debug(Recording, deployment, metrics, $, { result, : .id }, {
            deploymentId: result.deploymentId,
            environment: result.environment,
            status: result.status
        });
        // Store in history
        this.deploymentHistory.push(result);
        // Keep only recent history
        if (this.deploymentHistory.length > 1000) {
            this.deploymentHistory = this.deploymentHistory.slice(-1000);
        }
        // Record metrics
        this.recordMetric('deployment_duration', result.duration || 0, {
            environment: result.environment,
            status: result.status
        });
        this.recordMetric('deployment_success_rate', result.status === 'success' ? 1 : 0, {
            environment: result.environment
        });
        this.recordMetric('deployment_frequency', 1, {
            environment: result.environment,
            status: result.status
        });
        // Record service-specific metrics
        result.services.forEach(service => {
            this.recordMetric('service_deployment_status', service.status === 'success' ? 1 : 0, {
                serviceName: service.name,
                environment: result.environment
            });
            this.recordMetric('service_replica_count', service.replicas.desired, {
                serviceName: service.name,
                environment: result.environment
            });
        });
        // Record health check metrics
        result.healthChecks.forEach(healthCheck => {
            this.recordMetric('health_check_status', healthCheck.status === 'healthy' ? 1 : 0, {
                healthCheckName: healthCheck.name,
                environment: result.environment
            });
            this.recordMetric('health_check_duration', healthCheck.duration, {
                healthCheckName: healthCheck.name,
                environment: result.environment
            });
        });
    }
    /**
     * Get pipeline metrics for a specific time range
     */
    async getPipelineMetrics(timeRange) {
        const endTime = new Date();
        const startTime = this.parseTimeRange(timeRange, endTime);
        // Filter data by time range
        const pipelineData = this.pipelineHistory.filter(p => p.startTime >= startTime && p.startTime <= endTime);
        const buildData = this.buildHistory.filter(b => b.startTime >= startTime && b.startTime <= endTime);
        const deploymentData = this.deploymentHistory.filter(d => d.startTime >= startTime && d.startTime <= endTime);
        // Calculate DORA metrics
        const doraMetrics = this.calculateDORAMetrics(pipelineData, deploymentData);
        // Calculate pipeline performance metrics
        const performanceMetrics = this.calculatePerformanceMetrics(pipelineData, buildData);
        // Calculate quality metrics
        const qualityMetrics = this.calculateQualityMetrics(buildData);
        // Calculate reliability metrics
        const reliabilityMetrics = this.calculateReliabilityMetrics(pipelineData, deploymentData);
        return {
            timeRange: {
                start: startTime,
                end: endTime,
                duration: timeRange
            },
            summary: {
                totalPipelines: pipelineData.length,
                totalBuilds: buildData.length,
                totalDeployments: deploymentData.length
            },
            dora: doraMetrics,
            performance: performanceMetrics,
            quality: qualityMetrics,
            reliability: reliabilityMetrics,
            trends: this.calculateTrends(pipelineData, buildData, deploymentData)
        };
    }
    /**
     * Record infrastructure provisioning metrics
     */
    recordProvisioningMetrics(metrics) {
        `
    this.logger.debug(Recording provisioning metrics: ${metrics.infrastructureId}`, {
            duration: metrics.duration,
            resourceCount: metrics.resourceCount,
            success: metrics.success
        };
        ;
        this.recordMetric('infrastructure_provisioning_duration', metrics.duration, {
            infrastructureId: metrics.infrastructureId,
            success: metrics.success.toString()
        });
        this.recordMetric('infrastructure_resource_count', metrics.resourceCount, {
            infrastructureId: metrics.infrastructureId
        });
        this.recordMetric('infrastructure_provisioning_success_rate', metrics.success ? 1 : 0, {
            infrastructureId: metrics.infrastructureId
        });
    }
    /**
     * Get infrastructure metrics for a specific infrastructure
     */
    async getInfrastructureMetrics(infrastructureId) {
        // Return cached metrics or generate new ones
        const cached = this.infrastructureMetrics.get(infrastructureId);
        if (cached && this.isMetricsFresh(cached.lastUpdated)) {
            return cached;
        }
        // Generate new metrics (in a real implementation, this would query actual infrastructure)
        const metrics = {
            infrastructureId,
            resourceCount: 10, // Mock data
            healthStatus: {
                overall: 'healthy',
                resources: [],
                issues: []
            },
            costMetrics: {
                currentMonthlyCost: 500,
                projectedMonthlyCost: 520,
                costTrend: 'stable',
                costByResource: [],
                optimizationOpportunities: []
            },
            performanceMetrics: {
                responseTime: 150,
                throughput: 1000,
                errorRate: 0.01,
                availability: 99.9,
                resourceUtilization: []
            },
            securityMetrics: {
                securityScore: 85,
                vulnerabilities: [],
                complianceStatus: [],
                securityRecommendations: []
            },
            lastUpdated: new Date()
        };
        this.infrastructureMetrics.set(infrastructureId, metrics);
        return metrics;
    }
    /**
     * Get real-time metrics dashboard data
     */
    getDashboardMetrics() {
        const recentPipelines = this.pipelineHistory.slice(-50);
        const recentBuilds = this.buildHistory.slice(-50);
        const recentDeployments = this.deploymentHistory.slice(-50);
        return {
            current: {
                runningPipelines: recentPipelines.filter(p => p.status === 'running').length,
                queuedPipelines: recentPipelines.filter(p => p.status === 'pending').length,
                recentFailures: recentPipelines.filter(p => p.status === 'failed').length
            },
            recent: {
                pipelineSuccessRate: this.calculateSuccessRate(recentPipelines),
                buildSuccessRate: this.calculateSuccessRate(recentBuilds),
                deploymentSuccessRate: this.calculateSuccessRate(recentDeployments),
                averagePipelineDuration: this.calculateAverageDuration(recentPipelines),
                averageBuildDuration: this.calculateAverageDuration(recentBuilds),
                averageDeploymentDuration: this.calculateAverageDuration(recentDeployments)
            },
            alerts: this.generateAlerts(recentPipelines, recentBuilds, recentDeployments)
        };
    }
    // Private helper methods
    recordMetric(name, value, labels = {}) {
        const key = $, { name }, _$, { JSON, stringify };
        (labels);
    }
}
exports.MetricsCollector = MetricsCollector;
`;
    const existing = this.metrics.get(key) || { values: [], labels };
    
    existing.values.push({
      value,
      timestamp: new Date()
    });

    // Keep only recent values (last 1000)
    if (existing.values.length > 1000) {
      existing.values = existing.values.slice(-1000);
    }

    this.metrics.set(key, existing);
  }

  private updatePipelineAggregates(result: PipelineResult): void {
    const key = pipeline_${result.pipelineId};
    const existing = this.metrics.get(key) || {
      totalExecutions: 0,
      successfulExecutions: 0,
      totalDuration: 0,
      lastExecution: null
    };

    existing.totalExecutions++;
    if (result.status === 'success') {
      existing.successfulExecutions++;
    }
    existing.totalDuration += result.duration || 0;
    existing.lastExecution = result.startTime;

    this.metrics.set(key, existing);
  }

  private parseTimeRange(timeRange: string, endTime: Date): Date {
    const startTime = new Date(endTime);
    
    const match = timeRange.match(/^(\d+)([hdwmy])$/);
    if (!match) {
      // Default to 24 hours
      startTime.setHours(startTime.getHours() - 24);
      return startTime;
    }

    const [, amount, unit] = match;
    const value = parseInt(amount);

    switch (unit) {
      case 'h':
        startTime.setHours(startTime.getHours() - value);
        break;
      case 'd':
        startTime.setDate(startTime.getDate() - value);
        break;
      case 'w':
        startTime.setDate(startTime.getDate() - (value * 7));
        break;
      case 'm':
        startTime.setMonth(startTime.getMonth() - value);
        break;
      case 'y':
        startTime.setFullYear(startTime.getFullYear() - value);
        break;
    }

    return startTime;
  }

  private calculateDORAMetrics(
    pipelineData: PipelineResult[], 
    deploymentData: DeploymentResult[]
  ): Record<string, any> {
    // Deployment Frequency
    const deploymentFrequency = deploymentData.length > 0 ? 
      deploymentData.length / Math.max(1, this.getDaysBetween(
        deploymentData[0].startTime, 
        deploymentData[deploymentData.length - 1].startTime
      )) : 0;

    // Lead Time for Changes (from commit to production)
    const leadTimes = pipelineData
      .filter(p => p.environment === 'production' && p.status === 'success')
      .map(p => p.duration || 0);
    const averageLeadTime = leadTimes.length > 0 ? 
      leadTimes.reduce((sum, time) => sum + time, 0) / leadTimes.length : 0;

    // Change Failure Rate
    const productionDeployments = deploymentData.filter(d => d.environment === 'production');
    const failedDeployments = productionDeployments.filter(d => d.status === 'failed');
    const changeFailureRate = productionDeployments.length > 0 ? 
      failedDeployments.length / productionDeployments.length : 0;

    // Mean Time to Recovery (simplified - time between failure and next success)
    const meanTimeToRecovery = this.calculateMTTR(deploymentData);

    return {
      deploymentFrequency: {
        value: deploymentFrequency,
        unit: 'deployments/day',
        classification: this.classifyDeploymentFrequency(deploymentFrequency)
      },
      leadTimeForChanges: {
        value: averageLeadTime,
        unit: 'milliseconds',
        classification: this.classifyLeadTime(averageLeadTime)
      },
      changeFailureRate: {
        value: changeFailureRate,
        unit: 'percentage',
        classification: this.classifyChangeFailureRate(changeFailureRate)
      },
      meanTimeToRecovery: {
        value: meanTimeToRecovery,
        unit: 'milliseconds',
        classification: this.classifyMTTR(meanTimeToRecovery)
      }
    };
  }

  private calculatePerformanceMetrics(
    pipelineData: PipelineResult[], 
    buildData: BuildResult[]
  ): Record<string, any> {
    const pipelineDurations = pipelineData.map(p => p.duration || 0);
    const buildDurations = buildData.map(b => b.duration || 0);

    return {
      averagePipelineDuration: this.calculateAverage(pipelineDurations),
      medianPipelineDuration: this.calculateMedian(pipelineDurations),
      p95PipelineDuration: this.calculatePercentile(pipelineDurations, 95),
      averageBuildDuration: this.calculateAverage(buildDurations),
      medianBuildDuration: this.calculateMedian(buildDurations),
      p95BuildDuration: this.calculatePercentile(buildDurations, 95),
      throughput: pipelineData.length,
      parallelization: this.calculateAverageParallelization(pipelineData)
    };
  }

  private calculateQualityMetrics(buildData: BuildResult[]): Record<string, any> {
    const buildsWithCoverage = buildData.filter(b => b.metrics?.testCoverage);
    const buildsWithQuality = buildData.filter(b => b.metrics?.codeQualityScore);

    const averageCoverage = buildsWithCoverage.length > 0 ?
      buildsWithCoverage.reduce((sum, b) => sum + (b.metrics?.testCoverage || 0), 0) / buildsWithCoverage.length : 0;

    const averageQualityScore = buildsWithQuality.length > 0 ?
      buildsWithQuality.reduce((sum, b) => sum + (b.metrics?.codeQualityScore || 0), 0) / buildsWithQuality.length : 0;

    return {
      testCoverage: {
        average: averageCoverage,
        trend: this.calculateCoverageTrend(buildsWithCoverage)
      },
      codeQuality: {
        average: averageQualityScore,
        trend: this.calculateQualityTrend(buildsWithQuality)
      },
      testStability: this.calculateTestStability(buildData)
    };
  }

  private calculateReliabilityMetrics(
    pipelineData: PipelineResult[], 
    deploymentData: DeploymentResult[]
  ): Record<string, any> {
    return {
      pipelineSuccessRate: this.calculateSuccessRate(pipelineData),
      deploymentSuccessRate: this.calculateSuccessRate(deploymentData),
      rollbackRate: this.calculateRollbackRate(deploymentData),
      uptime: this.calculateUptime(deploymentData),
      errorRate: this.calculateErrorRate(pipelineData)
    };
  }

  private calculateTrends(
    pipelineData: PipelineResult[], 
    buildData: BuildResult[], 
    deploymentData: DeploymentResult[]
  ): Record<string, any> {
    return {
      pipelineSuccessRate: this.calculateTrend(pipelineData, 'success_rate'),
      averageDuration: this.calculateTrend(pipelineData, 'duration'),
      deploymentFrequency: this.calculateTrend(deploymentData, 'frequency'),
      buildStability: this.calculateTrend(buildData, 'success_rate')
    };
  }

  private calculateSuccessRate(data: any[]): number {
    if (data.length === 0) return 0;
    const successful = data.filter(item => item.status === 'success').length;
    return successful / data.length;
  }

  private calculateAverageDuration(data: any[]): number {
    if (data.length === 0) return 0;
    const durations = data.map(item => item.duration || 0);
    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? 
      (sorted[mid - 1] + sorted[mid]) / 2 : 
      sorted[mid];
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private getDaysBetween(start: Date, end: Date): number {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private calculateMTTR(deploymentData: DeploymentResult[]): number {
    // Simplified MTTR calculation
    const failures = deploymentData.filter(d => d.status === 'failed');
    if (failures.length === 0) return 0;

    let totalRecoveryTime = 0;
    let recoveryCount = 0;

    failures.forEach(failure => {
      const nextSuccess = deploymentData.find(d => 
        d.startTime > failure.startTime && 
        d.status === 'success' &&
        d.environment === failure.environment
      );

      if (nextSuccess) {
        totalRecoveryTime += nextSuccess.startTime.getTime() - failure.startTime.getTime();
        recoveryCount++;
      }
    });

    return recoveryCount > 0 ? totalRecoveryTime / recoveryCount : 0;
  }

  private calculateAverageParallelization(pipelineData: PipelineResult[]): number {
    if (pipelineData.length === 0) return 0;
    
    const parallelCounts = pipelineData.map(p => {
      // Count stages that could run in parallel
      return p.stages.filter(s => s.name.includes('parallel')).length;
    });

    return this.calculateAverage(parallelCounts);
  }

  private calculateCoverageTrend(buildsWithCoverage: BuildResult[]): string {
    if (buildsWithCoverage.length < 2) return 'stable';
    
    const recent = buildsWithCoverage.slice(-10);
    const older = buildsWithCoverage.slice(-20, -10);
    
    const recentAvg = this.calculateAverage(recent.map(b => b.metrics?.testCoverage || 0));
    const olderAvg = this.calculateAverage(older.map(b => b.metrics?.testCoverage || 0));
    
    if (recentAvg > olderAvg * 1.05) return 'improving';
    if (recentAvg < olderAvg * 0.95) return 'declining';
    return 'stable';
  }

  private calculateQualityTrend(buildsWithQuality: BuildResult[]): string {
    if (buildsWithQuality.length < 2) return 'stable';
    
    const recent = buildsWithQuality.slice(-10);
    const older = buildsWithQuality.slice(-20, -10);
    
    const recentAvg = this.calculateAverage(recent.map(b => b.metrics?.codeQualityScore || 0));
    const olderAvg = this.calculateAverage(older.map(b => b.metrics?.codeQualityScore || 0));
    
    if (recentAvg > olderAvg * 1.05) return 'improving';
    if (recentAvg < olderAvg * 0.95) return 'declining';
    return 'stable';
  }

  private calculateTestStability(buildData: BuildResult[]): number {
    // Calculate test stability based on consistent pass/fail patterns
    if (buildData.length < 5) return 1.0;
    
    const recent = buildData.slice(-20);
    const statusChanges = recent.slice(1).filter((build, index) => 
      build.status !== recent[index].status
    ).length;
    
    return Math.max(0, 1 - (statusChanges / recent.length));
  }

  private calculateRollbackRate(deploymentData: DeploymentResult[]): number {
    const deploymentsWithRollback = deploymentData.filter(d => d.rollbackInfo?.triggered);
    return deploymentData.length > 0 ? deploymentsWithRollback.length / deploymentData.length : 0;
  }

  private calculateUptime(deploymentData: DeploymentResult[]): number {
    // Simplified uptime calculation based on successful deployments
    return this.calculateSuccessRate(deploymentData);
  }

  private calculateErrorRate(pipelineData: PipelineResult[]): number {
    return 1 - this.calculateSuccessRate(pipelineData);
  }

  private calculateTrend(data: any[], metric: string): string {
    if (data.length < 10) return 'insufficient_data';
    
    const recent = data.slice(-5);
    const older = data.slice(-10, -5);
    
    let recentValue: number;
    let olderValue: number;
    
    switch (metric) {
      case 'success_rate':
        recentValue = this.calculateSuccessRate(recent);
        olderValue = this.calculateSuccessRate(older);
        break;
      case 'duration':
        recentValue = this.calculateAverageDuration(recent);
        olderValue = this.calculateAverageDuration(older);
        break;
      case 'frequency':
        recentValue = recent.length;
        olderValue = older.length;
        break;
      default:
        return 'unknown';
    }
    
    if (recentValue > olderValue * 1.1) return 'improving';
    if (recentValue < olderValue * 0.9) return 'declining';
    return 'stable';
  }

  private generateAlerts(
    recentPipelines: PipelineResult[], 
    _recentBuilds: BuildResult[], 
    _recentDeployments: DeploymentResult[]
  ): any[] {
    const alerts: any[] = [];
    
    // High failure rate alert
    const pipelineFailureRate = 1 - this.calculateSuccessRate(recentPipelines);
    if (pipelineFailureRate > 0.2) {
      alerts.push({
        type: 'high_failure_rate',`;
severity: 'warning', `
        message: `;
Pipeline;
failure;
rate;
is;
$;
{
    (pipelineFailureRate * 100).toFixed(1);
}
 % ,
    value;
pipelineFailureRate;
;
// Long duration alert
const avgDuration = this.calculateAverageDuration(recentPipelines);
if (avgDuration > 30 * 60 * 1000) { // 30 minutes
    alerts.push({
        type: 'long_duration',
        severity: 'info',
    } `
        message: Average pipeline duration is ${Math.round(avgDuration / 60000)} minutes`, value, avgDuration);
}
;
return alerts;
classifyDeploymentFrequency(frequency, number);
string;
{
    if (frequency >= 1)
        return 'elite';
    if (frequency >= 0.14)
        return 'high'; // Weekly
    if (frequency >= 0.03)
        return 'medium'; // Monthly
    return 'low';
}
classifyLeadTime(leadTime, number);
string;
{
    const hours = leadTime / (1000 * 60 * 60);
    if (hours <= 1)
        return 'elite';
    if (hours <= 24)
        return 'high';
    if (hours <= 168)
        return 'medium'; // 1 week
    return 'low';
}
classifyChangeFailureRate(rate, number);
string;
{
    if (rate <= 0.05)
        return 'elite';
    if (rate <= 0.10)
        return 'high';
    if (rate <= 0.15)
        return 'medium';
    return 'low';
}
classifyMTTR(mttr, number);
string;
{
    const hours = mttr / (1000 * 60 * 60);
    if (hours <= 1)
        return 'elite';
    if (hours <= 24)
        return 'high';
    if (hours <= 168)
        return 'medium'; // 1 week
    return 'low';
}
isMetricsFresh(lastUpdated, Date);
boolean;
{
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastUpdated > fiveMinutesAgo;
}
//# sourceMappingURL=MetricsCollector.js.map