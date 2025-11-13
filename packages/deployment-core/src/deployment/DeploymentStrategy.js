"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseDeploymentStrategy = exports.ServiceDeploymentStatus = exports.DeploymentPhase = void 0;
const events_1 = require("events");
const pipeline_1 = require("../types/pipeline");
var DeploymentPhase;
(function (DeploymentPhase) {
    DeploymentPhase["PREPARING"] = "preparing";
    DeploymentPhase["DEPLOYING"] = "deploying";
    DeploymentPhase["VALIDATING"] = "validating";
    DeploymentPhase["PROMOTING"] = "promoting";
    DeploymentPhase["COMPLETING"] = "completing";
    DeploymentPhase["ROLLING_BACK"] = "rolling_back";
    DeploymentPhase["COMPLETED"] = "completed";
    DeploymentPhase["FAILED"] = "failed";
})(DeploymentPhase || (exports.DeploymentPhase = DeploymentPhase = {}));
var ServiceDeploymentStatus;
(function (ServiceDeploymentStatus) {
    ServiceDeploymentStatus["PENDING"] = "pending";
    ServiceDeploymentStatus["DEPLOYING"] = "deploying";
    ServiceDeploymentStatus["READY"] = "ready";
    ServiceDeploymentStatus["FAILED"] = "failed";
    ServiceDeploymentStatus["ROLLING_BACK"] = "rolling_back";
})(ServiceDeploymentStatus || (exports.ServiceDeploymentStatus = ServiceDeploymentStatus = {}));
/**
 * Abstract base class for deployment strategies
 */
class BaseDeploymentStrategy extends events_1.EventEmitter {
    logger;
    deployments = new Map();
    constructor(logger) {
        super();
        this.logger = logger;
    }
    async getHealthChecks(config) {
        const healthChecks = [];
        // Add service-specific health checks
        config.services.forEach(service => {
            if (service.healthCheck) {
                healthChecks.push({
                    name: `${service.name}-health,
          type: service.healthCheck.type as any,
          endpoint: service.healthCheck.path,
          port: service.healthCheck.port,
          path: service.healthCheck.path,
          command: service.healthCheck.command,
          timeout: service.healthCheck.timeoutSeconds * 1000,
          interval: service.healthCheck.periodSeconds * 1000,
          retries: service.healthCheck.failureThreshold,
          expectedStatus: 200
        });
      }
    });

    // Add deployment-specific health checks
    config.healthChecks.forEach(check => {
      healthChecks.push({
        name: (check as any).name || 'deployment-health',
        type: check.type as any,
        endpoint: check.path,
        port: check.port,
        path: check.path,
        command: check.command,
        timeout: check.timeoutSeconds * 1000,
        interval: check.periodSeconds * 1000,
        retries: check.failureThreshold,
        expectedStatus: 200
      });
    });

    return healthChecks;
  }

  async getProgress(deploymentId: string): Promise<DeploymentProgress> {
    const progress = this.deployments.get(deploymentId);
    if (!progress) {`,
                    throw: new Error(`Deployment not found: ${deploymentId}`)
                });
                return progress;
            }
        }, protected, createInitialProgress(deploymentId, string, strategy, pipeline_1.DeploymentStrategy, services, any[]), DeploymentProgress, {
            const: progress, DeploymentProgress = {
                deploymentId,
                strategy,
                phase: DeploymentPhase.PREPARING,
                progress: 0,
                currentStep: 'Initializing deployment',
                totalSteps: this.calculateTotalSteps(strategy, services.length),
                completedSteps: 0,
                estimatedTimeRemaining: 0,
                services: services.map(service => ({
                    name: service.name,
                    status: ServiceDeploymentStatus.PENDING,
                    progress: 0,
                    replicas: {
                        desired: service.replicas,
                        ready: 0,
                        available: 0,
                        unavailable: service.replicas
                    },
                    version: {
                        current: 'unknown',
                        target: service.tag
                    },
                    lastUpdated: new Date()
                })),
                healthChecks: [],
                logs: []
            },
            this: .deployments.set(deploymentId, progress),
            return: progress
        }, protected, updateProgress(deploymentId, string, updates, (Partial)), void {
            const: progress = this.deployments.get(deploymentId),
            if(progress) {
                Object.assign(progress, updates);
                this.emit('progress', { deploymentId, progress });
            }
        }, protected, calculateTotalSteps(strategy, pipeline_1.DeploymentStrategy, serviceCount, number), number, {
            switch(strategy) {
            },
            case: pipeline_1.DeploymentStrategy.ROLLING_UPDATE,
            return: 3 + serviceCount, // prepare, deploy services, validate, complete
            case: pipeline_1.DeploymentStrategy.BLUE_GREEN,
            return: 5 + serviceCount, // prepare, deploy to blue, validate, switch traffic, cleanup
            case: pipeline_1.DeploymentStrategy.CANARY,
            return: 6 + serviceCount, // prepare, deploy canary, validate, promote gradually, complete, cleanup
            default: ,
            return: 3 + serviceCount
        });
    }
    async executeHealthChecks(healthChecks, deploymentId) {
        const results = [];
        for (const check of healthChecks) {
            const result = await this.executeHealthCheck(check, deploymentId);
            results.push(result);
        }
        return results;
    }
    async executeHealthCheck(check, _deploymentId) {
        const startTime = new Date();
        try {
            let success = false;
            let message = '';
            switch (check.type) {
                case 'http':
                    const httpResult = await this.executeHttpHealthCheck(check);
                    success = httpResult.success;
                    message = httpResult.message;
                    break;
                case 'tcp':
                    const tcpResult = await this.executeTcpHealthCheck(check);
                    success = tcpResult.success;
                    message = tcpResult.message;
                    break;
                case 'exec':
                    const execResult = await this.executeExecHealthCheck(check);
                    success = execResult.success;
                    message = execResult.message;
                    break;
                default:
                    throw new Error(Unsupported, health, check, type, $, { check, : .type });
            }
            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();
            return {
                name: check.name,
                status: success ? 'healthy' : 'unhealthy',
                message,
                timestamp: endTime,
                duration
            };
        }
        catch (error) {
            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();
            return {
                name: check.name,
                status: 'unhealthy',
                message: error.message,
                timestamp: endTime,
                duration
            };
        }
    }
    async executeHttpHealthCheck(check) {
        const axios = await import('axios');
        try {
            `
      const url = check.endpoint || http://localhost:${check.port}`;
            $;
            {
                check.path || '/health';
            }
            ;
            const response = await axios.default.get(url, {
                timeout: check.timeout,
                validateStatus: (status) => status === (check.expectedStatus || 200)
            });
            `
      return {`;
            success: true,
                message;
            HTTP;
            health;
            check;
            passed: $;
            {
                response.status;
            }
        }
        finally { }
        ;
    }
    catch(error) {
        return {} `
        success: false,`;
        message: `HTTP health check failed: ${error.message}
      };
    }
  }

  private async executeTcpHealthCheck(check: HealthCheckConfig): Promise<{ success: boolean; message: string }> {
    const net = await import('net');
    
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const timeout = setTimeout(() => {
        socket.destroy();
        resolve({`;
        success: false, `
          message: TCP health check timed out after ${check.timeout}`;
        ms;
    }
    ;
}
exports.BaseDeploymentStrategy = BaseDeploymentStrategy;
check.timeout;
;
socket.connect(check.port, 'localhost', () => {
    clearTimeout(timeout);
    socket.destroy();
    resolve({
        success: true,
        message: TCP, connection, successful, on, port, $
    }, { check, : .port });
});
;
socket.on('error', (error) => {
    clearTimeout(timeout);
    resolve({
        success: false,
        message: TCP, health, check, failed: $
    }, { error, : .message });
});
;
;
async;
executeExecHealthCheck(check, HealthCheckConfig);
Promise < { success: boolean, message: string } > {
    const: { spawn } = await import('child_process'),
    return: new Promise((resolve) => {
        if (!check.command || check.command.length === 0) {
            resolve({
                success: false,
                message: 'No command specified for exec health check'
            });
            return;
        }
        const [command, ...args] = check.command;
        const process = spawn(command, args, {
            timeout: check.timeout
        });
        let stdout = '';
        let stderr = '';
        process.stdout?.on('data', (data) => {
            stdout += data.toString();
        });
        process.stderr?.on('data', (data) => {
            stderr += data.toString();
        });
        process.on('close', (code) => {
            const success = code === 0;
            `
        const message = success ? `;
            Command;
            executed;
            successfully: $;
            {
                stdout.trim();
            }
            `
          Command failed with code ${code}: ${stderr.trim()};

        resolve({ success, message });
      });

      process.on('error', (error) => {`;
            resolve({} `
          success: false,`, message, Exec, health, check, failed, $, { error, : .message });
        });
    })
};
;
async;
waitForServiceReady(serviceName, string, targetReplicas, number, timeout, number = 300000);
Promise < boolean > {
    const: startTime = Date.now(),
    while(Date) { }, : .now() - startTime < timeout
};
{
    try {
        // This would integrate with actual orchestration platform (Kubernetes, Docker Swarm, etc.)
        // For now, simulate the check
        const readyReplicas = await this.getServiceReadyReplicas(serviceName);
        if (readyReplicas >= targetReplicas) {
            return true;
        }
        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, 5000));
        `
      } catch (error) {`;
        this.logger.warn(Error, checking, service, readiness, $, { serviceName } `, {
          error: error.message
        });
      }
    }

    return false;
  }

  private async getServiceReadyReplicas(_serviceName: string): Promise<number> {
    // This would integrate with the actual orchestration platform
    // For now, simulate a gradually increasing ready count
    return Math.floor(Math.random() * 3) + 1;
  }

  protected logDeploymentStep(deploymentId: string, message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    this.logger[level](message, { deploymentId });
    
    const progress = this.deployments.get(deploymentId);
    if (progress) {
      progress.logs.push([${new Date().toISOString()}] ${message}`);
    }
    finally {
    }
}
//# sourceMappingURL=DeploymentStrategy.js.map