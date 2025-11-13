"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentOrchestrator = exports.ApprovalStatus = void 0;
const events_1 = require("events");
var ApprovalStatus;
(function (ApprovalStatus) {
    ApprovalStatus["PENDING"] = "pending";
    ApprovalStatus["APPROVED"] = "approved";
    ApprovalStatus["REJECTED"] = "rejected";
    ApprovalStatus["EXPIRED"] = "expired";
})(ApprovalStatus || (exports.ApprovalStatus = ApprovalStatus = {}));
/**
 * DeploymentOrchestrator manages the complete deployment lifecycle with approvals and gates
 */
class DeploymentOrchestrator extends events_1.EventEmitter {
    logger;
    strategies = new Map();
    activeDeployments = new Map();
    approvals = new Map();
    deploymentHistory = new Map();
    constructor(logger) {
        super();
        this.logger = logger;
        this.initializeStrategies();
    }
    /**
     * Execute a deployment with full orchestration
     */
    async executeDeployment(config) {
        const deploymentId = `deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)};
    const startTime = new Date();
`;
        this.logger.info(Starting, deployment, orchestration, $, { deploymentId } `, {
      environment: config.environment,
      strategy: config.strategy.type,
      services: config.services.length
    });

    try {
      // Create deployment execution tracking
      const execution: DeploymentExecution = {
        id: deploymentId,
        config,
        status: 'preparing',
        startTime,
        currentPhase: 'validation',
        approvals: [],
        gates: [],
        logs: []
      };

      this.activeDeployments.set(deploymentId, execution);

      // Phase 1: Pre-deployment validation
      await this.validateDeployment(config, execution);

      // Phase 2: Handle approvals if required
      if (config.approvals.some(a => a.required)) {
        execution.currentPhase = 'approval';
        await this.handleApprovals(config, execution);
      }

      // Phase 3: Execute deployment gates
      execution.currentPhase = 'gates';
      await this.executeDeploymentGates(config, execution);

      // Phase 4: Execute deployment strategy
      execution.currentPhase = 'deployment';
      execution.status = 'deploying';

      const strategy = this.getStrategy(config.strategy.type);
      const result = await strategy.deploy(config);

      // Phase 5: Post-deployment validation
      execution.currentPhase = 'post_validation';
      await this.postDeploymentValidation(result, execution);

      // Update execution status
      execution.status = result.status === 'success' ? 'completed' : 'failed';
      execution.endTime = new Date();

      // Store deployment result
      this.deploymentHistory.set(deploymentId, result);

      // Emit completion event
      this.emit('deployment:orchestrated', { deploymentId, result, execution });

      this.logger.info(`, Deployment, orchestration, completed, $, { deploymentId }, {
            status: result.status,
            duration: result.duration
        });
        return result;
    }
    catch(error) {
        `
      this.logger.error(Deployment orchestration failed: ${deploymentId}` `, {
        error: error.message,
        stack: error.stack
      });

      const execution = this.activeDeployments.get(deploymentId);
      if (execution) {
        execution.status = 'failed';
        execution.endTime = new Date();
        execution.logs.push(Orchestration failed: ${error.message});
      }

      // Create failed result
      const failedResult: DeploymentResult = {
        id: deploymentId,
        deploymentId: config.id,
        status: PipelineStatus.FAILED,
        startTime,
        endTime: new Date(),
        duration: Date.now() - startTime.getTime(),
        environment: config.environment,
        services: [],
        healthChecks: [],
        logs: [error.message],
        error: error.message
      };

      this.deploymentHistory.set(deploymentId, failedResult);
      this.emit('deployment:failed', { deploymentId, result: failedResult, error });

      return failedResult;

    } finally {
      this.activeDeployments.delete(deploymentId);
    }
  }

  /**
   * Request approval for a deployment
   */
  async requestApproval(
    deploymentId: string,
    approvers: string[],
    reason?: string
  ): Promise<DeploymentApproval> {`;
        const approvalId = `approval-${Date.now()};
    const approval: DeploymentApproval = {
      id: approvalId,
      deploymentId,
      requiredApprovers: approvers,
      approvers: [],
      status: ApprovalStatus.PENDING,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      reason,
      metadata: {}
    };` `
    this.approvals.set(approvalId, approval);

    this.logger.info(Approval requested: ${approvalId}`, { deploymentId, approvers: approvers, length, reason };
        this.emit('approval:requested', { approvalId, approval });
        return approval;
    }
    /**
     * Approve a deployment
     */
    async approveDeployment(approvalId, approver, comment) {
        const approval = this.approvals.get(approvalId);
        if (!approval) {
            throw new Error(Approval, not, found, $, { approvalId } `);
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new Error(Approval is not pending: ${approval.status});
    }

    if (!approval.requiredApprovers.includes(approver)) {`);
            throw new Error(User, not, authorized, to, approve, $, { approver } `);
    }

    if (approval.approvers.includes(approver)) {
      throw new Error(User has already approved: ${approver}`);
        }
        // Add approver
        approval.approvers.push(approver);
        approval.metadata[approver] = {
            approvedAt: new Date(),
            comment
        };
        // Check if all required approvals are received
        const hasAllApprovals = approval.requiredApprovers.every(required => approval.approvers.includes(required));
        if (hasAllApprovals) {
            approval.status = ApprovalStatus.APPROVED;
        }
        this.logger.info(Deployment, approved, by, $, { approver }, $, { approvalId }, {
            deploymentId: approval.deploymentId,
            approvers: approval.approvers.length,
            required: approval.requiredApprovers.length,
            complete: hasAllApprovals
        });
        this.emit('approval:updated', { approvalId, approval, approver });
        return hasAllApprovals;
    }
    /**
     * Reject a deployment
     */
    async rejectDeployment(approvalId, approver, reason) {
        const approval = this.approvals.get(approvalId);
        `
    if (!approval) {`;
        throw new Error(Approval, not, found, $, { approvalId } `);
    }

    if (!approval.requiredApprovers.includes(approver)) {
      throw new Error(User not authorized to reject: ${approver});
    }

    approval.status = ApprovalStatus.REJECTED;
    approval.reason = reason;
    approval.metadata.rejectedBy = approver;
    approval.metadata.rejectedAt = new Date();` `
    this.logger.info(Deployment rejected by ${approver}`, $, { approvalId }, {
            deploymentId: approval.deploymentId,
            reason
        });
        this.emit('approval:rejected', { approvalId, approval, approver, reason });
    }
    /**
     * Get deployment progress
     */
    async getDeploymentProgress(deploymentId) {
        const execution = this.activeDeployments.get(deploymentId);
        if (!execution) {
            return null;
        }
        try {
            const strategy = this.getStrategy(execution.config.strategy.type);
            return await strategy.getProgress(deploymentId);
        }
        catch (error) {
            this.logger.warn(Failed, to, get, deployment, progress, $, { deploymentId }, {
                error: error.message
            });
            return null;
        }
    }
    /**
     * Cancel a deployment
     */
    async cancelDeployment(deploymentId, reason) {
        const execution = this.activeDeployments.get(deploymentId);
        if (!execution) {
            return false;
        }
        try {
            `
      execution.status = 'cancelled';`;
            execution.endTime = new Date();
            `
      execution.logs.push(Deployment cancelled: ${reason});` `
      this.logger.info(Deployment cancelled: ${deploymentId}`, { reason };
            ;
            this.emit('deployment:cancelled', { deploymentId, reason });
            return true;
        }
        catch (error) {
            this.logger.error(Failed, to, cancel, deployment, $, { deploymentId }, {
                error: error.message
            });
            return false;
        }
    }
    /**
     * Rollback a deployment
     */
    async rollbackDeployment(deploymentId, reason) {
        const result = this.deploymentHistory.get(deploymentId);
        `
    if (!result) {`;
        throw new Error(Deployment, not, found, $, { deploymentId } `);
    }

    const strategy = this.getStrategy(result.services[0]?.name || 'rolling_update' as any);
    return await strategy.rollback(deploymentId, reason) as any;
  }

  /**
   * Get deployment history
   */
  getDeploymentHistory(limit: number = 50): DeploymentResult[] {
    const results = Array.from(this.deploymentHistory.values());
    return results
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  // Private helper methods

  private initializeStrategies(): void {
    this.strategies.set(StrategyType.ROLLING_UPDATE, new RollingUpdateStrategy(this.logger));
    this.strategies.set(StrategyType.BLUE_GREEN, new BlueGreenStrategy(this.logger));
    this.strategies.set(StrategyType.CANARY, new CanaryStrategy(this.logger));
  }

  private getStrategy(type: StrategyType): IDeploymentStrategy {
    const strategy = this.strategies.get(type);
    if (!strategy) {
      throw new Error(Unsupported deployment strategy: ${type});
    }
    return strategy;
  }

  private async validateDeployment(
    config: DeploymentConfig,
    execution: DeploymentExecution
  ): Promise<void> {
    execution.logs.push('Starting deployment validation');

    // Validate strategy configuration
    const strategy = this.getStrategy(config.strategy.type);
    const validation = await strategy.validate(config);

    if (!validation.valid) {`);
        throw new Error(Deployment, validation, failed, $, { validation, : .errors.join(', ') } `);
    }

    // Validate environment readiness
    await this.validateEnvironmentReadiness(config, execution);

    // Validate resource availability
    await this.validateResourceAvailability(config, execution);

    execution.logs.push('Deployment validation completed');
  }

  private async handleApprovals(
    config: DeploymentConfig,
    execution: DeploymentExecution
  ): Promise<void> {
    execution.logs.push('Handling deployment approvals');

    for (const approvalConfig of config.approvals) {
      if (!approvalConfig.required) continue;

      const approval = await this.requestApproval(
        execution.id,
        approvalConfig.approvers,
        `, Deployment, approval, required);
        for ($; { config, : .environment };)
            ;
        execution.approvals.push(approval.id);
        // Wait for approval or timeout
        const approved = await this.waitForApproval(approval.id, approvalConfig.timeout);
        if (!approved) {
            `
        throw new Error(Deployment approval timed out or was rejected: ${approval.id}`;
            ;
        }
    }
    execution;
    logs;
}
exports.DeploymentOrchestrator = DeploymentOrchestrator;
async;
executeDeploymentGates(config, pipeline_1.DeploymentConfig, execution, DeploymentExecution);
Promise < void  > {
    execution, : .logs.push('Executing deployment gates'),
    // This would implement custom deployment gates
    // For now, just log that gates are being executed
    execution, : .logs.push('Deployment gates validation completed')
};
async;
postDeploymentValidation(result, pipeline_1.DeploymentResult, execution, DeploymentExecution);
Promise < void  > {
    execution, : .logs.push('Running post-deployment validation'),
    // Validate deployment success
    if(result) { }, : .status !== 'success'
};
{
    throw new Error(`Deployment failed: ${result.error});
    }

    // Validate all services are healthy
    const unhealthyServices = result.services.filter(s => s.status !== 'success');
    if (unhealthyServices.length > 0) {`);
    throw new Error(Unhealthy, services, $, { unhealthyServices, : .map(s => s.name).join(', ') } ``);
}
// Validate health checks
const failedHealthChecks = result.healthChecks.filter(h => h.status !== 'healthy');
if (failedHealthChecks.length > 0) {
    throw new Error(Failed, health, checks, $, { failedHealthChecks, : .map(h => h.name).join(', ') });
}
execution.logs.push('Post-deployment validation completed');
async;
validateEnvironmentReadiness(config, pipeline_1.DeploymentConfig, execution, DeploymentExecution);
Promise < void  > {
    // Validate that the target environment is ready for deployment`
    execution, : .logs.push(Validating, $, { config, : .environment } ` environment readiness`),
    // This would integrate with actual environment validation
    await, new: Promise(resolve => setTimeout(resolve, 1000))
};
async;
validateResourceAvailability(config, pipeline_1.DeploymentConfig, execution, DeploymentExecution);
Promise < void  > {
    // Validate that sufficient resources are available
    execution, : .logs.push('Validating resource availability'),
    // This would integrate with actual resource validation
    await, new: Promise(resolve => setTimeout(resolve, 1000))
};
async;
waitForApproval(approvalId, string, timeout, number);
Promise < boolean > {
    const: startTime = Date.now(),
    while(Date) { }, : .now() - startTime < timeout
};
{
    const approval = this.approvals.get(approvalId);
    if (!approval) {
        return false;
    }
    if (approval.status === ApprovalStatus.APPROVED) {
        return true;
    }
    if (approval.status === ApprovalStatus.REJECTED || approval.status === ApprovalStatus.EXPIRED) {
        return false;
    }
    // Wait before checking again
    await new Promise(resolve => setTimeout(resolve, 5000));
}
// Mark as expired
const approval = this.approvals.get(approvalId);
if (approval && approval.status === ApprovalStatus.PENDING) {
    approval.status = ApprovalStatus.EXPIRED;
}
return false;
//# sourceMappingURL=DeploymentOrchestrator.js.map