"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineValidator = void 0;
const pipeline_1 = require("../types/pipeline");
/**
 * Pipeline Validator ensures pipeline configurations are valid and safe to execute
 */
class PipelineValidator {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    /**
     * Validate a complete pipeline definition
     */
    async validatePipeline(pipeline) {
        const errors = [];
        try {
            // Basic structure validation
            this.validateBasicStructure(pipeline, errors);
            // Validate stages
            this.validateStages(pipeline.stages, errors);
            // Validate triggers
            this.validateTriggers(pipeline.triggers, errors);
            // Validate environment configuration
            this.validateEnvironment(pipeline.environment, errors);
            // Validate quality gates
            this.validateQualityGates(pipeline.qualityGates, errors);
            // Validate notifications
            this.validateNotifications(pipeline.notifications, errors);
            // Validate stage dependencies
            this.validateStageDependencies(pipeline.stages, errors);
            // Validate timeout and retry policies
            this.validateTimeoutAndRetry(pipeline, errors);
            // Security validation
            this.validateSecurity(pipeline, errors);
            // Resource validation
            this.validateResources(pipeline, errors);
            const isValid = errors.length === 0;
            this.logger.info(`Pipeline validation completed: ${pipeline.name}, {
        pipelineId: pipeline.id,
        valid: isValid,
        errorCount: errors.length
      });

      if (!isValid) {`, this.logger.warn(`Pipeline validation errors: ${pipeline.name}`, {
                pipelineId: pipeline.id,
                errors
            }));
        }
        finally {
        }
        return { valid: isValid, errors };
    }
    catch(error) {
        this.logger.error(Pipeline, validation, failed, $, { error, : .message }, {
            pipelineId: pipeline.id,
            error: error.stack
        });
        `
      errors.push(Validation error: ${error.message}`;
        ;
        return { valid: false, errors };
    }
}
exports.PipelineValidator = PipelineValidator;
/**
 * Validate a deployment configuration
 */
async;
validateDeployment(deployment, pipeline_1.DeploymentConfig);
Promise < { valid: boolean, errors: string[] } > {
    const: errors, string, []:  = [],
    try: {
        // Basic deployment validation
        this: .validateDeploymentBasics(deployment, errors),
        // Validate services
        this: .validateServices(deployment.services, errors),
        // Validate deployment strategy
        this: .validateDeploymentStrategy(deployment.strategy, errors),
        // Validate health checks
        this: .validateHealthChecks(deployment.healthChecks, errors),
        // Validate rollback policy
        this: .validateRollbackPolicy(deployment.rollbackPolicy, errors),
        // Validate approvals
        this: .validateApprovals(deployment.approvals, errors),
        const: isValid = errors.length === 0,
        this: .logger.info(Deployment, validation, completed, $, { deployment, : .id }, {
            deploymentId: deployment.id,
            environment: deployment.environment,
            valid: isValid,
            errorCount: errors.length
        }),
        return: { valid: isValid, errors }
    } `
`
};
try { }
catch (error) {
    this.logger.error(Deployment, validation, failed, $, { error, : .message } `, {
        deploymentId: deployment.id,
        error: error.stack
      });

      errors.push(Deployment validation error: ${error.message});
      return { valid: false, errors };
    }
  }

  // Private validation methods

  private validateBasicStructure(pipeline: PipelineDefinition, errors: string[]): void {
    if (!pipeline.id) {
      errors.push('Pipeline ID is required');
    }

    if (!pipeline.name) {
      errors.push('Pipeline name is required');
    }

    if (!pipeline.version) {
      errors.push('Pipeline version is required');
    }

    if (!pipeline.stages || pipeline.stages.length === 0) {
      errors.push('Pipeline must have at least one stage');
    }

    if (!pipeline.triggers || pipeline.triggers.length === 0) {
      errors.push('Pipeline must have at least one trigger');
    }

    if (!pipeline.environment) {
      errors.push('Pipeline environment configuration is required');
    }

    if (pipeline.timeout && pipeline.timeout <= 0) {
      errors.push('Pipeline timeout must be positive');
    }
  }

  private validateStages(stages: PipelineStage[], errors: string[]): void {
    const stageIds = new Set<string>();
    const stageNames = new Set<string>();` `
    stages.forEach((stage, index) => {
      const stagePrefix = Stage ${index + 1} (${stage.name || 'unnamed'}`);
    // Basic stage validation
    if (!stage.id) {
        errors.push($, { stagePrefix } `: Stage ID is required);
      } else if (stageIds.has(stage.id)) {
        errors.push(${stagePrefix}: Duplicate stage ID: ${stage.id});
      } else {
        stageIds.add(stage.id);
      }
`);
        if (!stage.name) {
            `
        errors.push(`;
            $;
            {
                stagePrefix;
            }
            Stage;
            name;
            is;
            required;
            ;
            `
      } else if (stageNames.has(stage.name)) {`;
            errors.push($, { stagePrefix } `: Duplicate stage name: ${stage.name});
      } else {
        stageNames.add(stage.name);
      }
`);
            if (!Object.values(pipeline_1.StageType).includes(stage.type)) {
                `
        errors.push(${stagePrefix}`;
                Invalid;
                stage;
                type: $;
                {
                    stage.type;
                }
                ;
            }
            if (!stage.tasks || stage.tasks.length === 0) {
                errors.push($, { stagePrefix }, Stage, must, have, at, least, one, task);
            }
            `
      if (stage.timeout && stage.timeout <= 0) {`;
            errors.push($, { stagePrefix } `: Stage timeout must be positive);
      }

      // Validate tasks within the stage
      this.validateTasks(stage.tasks, errors, stagePrefix);

      // Validate stage conditions
      this.validateStageConditions(stage.conditions, errors, stagePrefix);

      // Validate retry policy
      this.validateRetryPolicy(stage.retryPolicy, errors, stagePrefix);
    });
  }

  private validateTasks(tasks: PipelineTask[], errors: string[], stagePrefix: string): void {
    const taskIds = new Set<string>();
    const taskNames = new Set<string>();

    tasks.forEach((task, index) => {
      const taskPrefix = ${stagePrefix} - Task ${index + 1} (${task.name || 'unnamed'});

      // Basic task validation
      if (!task.id) {`, errors.push($, { taskPrefix } `: Task ID is required);
      } else if (taskIds.has(task.id)) {
        errors.push(${taskPrefix}: Duplicate task ID: ${task.id}`));
        }
        else {
            taskIds.add(task.id);
        }
        if (!task.name) {
            errors.push($, { taskPrefix }, Task, name, is, required);
            `
      } else if (taskNames.has(task.name)) {`;
            errors.push($, { taskPrefix }, Duplicate, task, name, $, { task, : .name } `);
      } else {
        taskNames.add(task.name);
      }

      if (!task.type) {
        errors.push(${taskPrefix}: Task type is required);
      }

      // Validate that task has either command or script`);
            if (!task.command && !task.script) {
                `
        errors.push(${taskPrefix}`;
                Task;
                must;
                have;
                either;
                command;
                or;
                script;
                ;
            }
            if (task.timeout && task.timeout <= 0) {
                errors.push($, { taskPrefix }, Task, timeout, must, be, positive);
            }
            // Validate task parameters based on type
            this.validateTaskParameters(task, errors, taskPrefix);
            // Validate task conditions
            this.validateTaskConditions(task.conditions, errors, taskPrefix);
            // Validate retry policy
            this.validateRetryPolicy(task.retryPolicy, errors, taskPrefix);
            // Validate artifacts
            this.validateTaskArtifacts(task.artifacts, errors, taskPrefix);
        }
        ;
    }
    validateTaskParameters(task, pipeline_1.PipelineTask, errors, string[], taskPrefix, string);
    void {
        switch(task) { }, : .type
    };
    {
        'docker';
        if (!task.parameters.image) {
            errors.push($, { taskPrefix }, Docker, task, requires, 'image', parameter);
        }
        break;
        'kubernetes';
        if (!task.parameters.action) {
            `
          errors.push(${taskPrefix}: Kubernetes task requires 'action' parameter);`;
        }
        `
        if (!task.parameters.resource && !task.parameters.manifest) {
          errors.push(${taskPrefix}: Kubernetes task requires either 'resource' or 'manifest' parameter);
        }
        break;`;
        'test';
        `
        if (!task.parameters.testCommand && !task.command && !task.script) {`;
        errors.push($, { taskPrefix }, Test, task, requires, 'testCommand', parameter, or, command / script);
    }
    break;
}
validateTriggers(triggers, any[], errors, string[]);
void {
    triggers, : .forEach((trigger, index) => {
        const triggerPrefix = Trigger, $, { index };
        +1;
    })
} `
`;
if (!Object.values(pipeline_1.TriggerType).includes(trigger.type)) {
    `
        errors.push(${triggerPrefix}: Invalid trigger type: ${trigger.type});
      }

      if (!trigger.configuration) {
        errors.push(${triggerPrefix}: Trigger configuration is required);
      }

      // Validate trigger filters`;
    if (trigger.filters) {
        `
        trigger.filters.forEach((filter: any, filterIndex: number) => {`;
        if (!filter.type || !filter.pattern) {
            errors.push($, { triggerPrefix } - Filter, $, { filterIndex } + 1);
        }
        Filter;
        are;
        required;
        ;
    }
}
;
;
validateEnvironment(environment, any, errors, string[]);
void {
    if(, environment) { }, : .name
};
{
    errors.push('Environment name is required');
}
if (!environment.type) {
    errors.push('Environment type is required');
}
if (environment.resources) {
    if (environment.resources.cpu && !this.isValidResourceQuantity(environment.resources.cpu)) {
        errors.push('Invalid CPU resource quantity format');
    }
    if (environment.resources.memory && !this.isValidResourceQuantity(environment.resources.memory)) {
        errors.push('Invalid memory resource quantity format');
    }
    if (environment.resources.storage && !this.isValidResourceQuantity(environment.resources.storage)) {
        errors.push('Invalid storage resource quantity format');
    }
}
if (environment.constraints) {
    if (environment.constraints.maxConcurrentDeployments && environment.constraints.maxConcurrentDeployments <= 0) {
        errors.push('Max concurrent deployments must be positive');
    }
    if (environment.constraints.requiredApprovals && environment.constraints.requiredApprovals < 0) {
        errors.push('Required approvals cannot be negative');
    }
}
`
`;
validateQualityGates(qualityGates, any[], errors, string[]);
void {} `
    qualityGates.forEach((gate, index) => {
      const gatePrefix = Quality Gate ${index + 1} (${gate.name || 'unnamed'})`;
if (!gate.name) {
    errors.push($, { gatePrefix } `: Quality gate name is required);
      }

      if (!gate.type) {
        errors.push(${gatePrefix}: Quality gate type is required);
      }

      if (gate.threshold === undefined || gate.threshold === null) {`, errors.push($, { gatePrefix } `: Quality gate threshold is required);
      }

      if (!gate.operator) {
        errors.push(${gatePrefix}: Quality gate operator is required);
      }` `
      if (!['greater_than', 'less_than', 'equals'].includes(gate.operator)) {
        errors.push(${gatePrefix}`, Invalid, quality, gate, operator, $, { gate, : .operator }));
}
`
`;
if (!['fail', 'warn', 'ignore'].includes(gate.failureBehavior)) {
    errors.push($, { gatePrefix }, Invalid, failure, behavior, $, { gate, : .failureBehavior });
}
;
`
`;
validateNotifications(notifications, any[], errors, string[]);
void {} `
    notifications.forEach((notification, index) => {
      const notificationPrefix = Notification ${index + 1};
`;
if (!notification.channels || notification.channels.length === 0) {
    `
        errors.push(${notificationPrefix}`;
    At;
    least;
    one;
    notification;
    channel;
    is;
    required;
    ;
}
if (!notification.events || notification.events.length === 0) {
    errors.push($, { notificationPrefix }, At, least, one, notification, event, is, required);
}
notification.channels?.forEach((channel, channelIndex) => {
    if (!channel.type) {
        errors.push($, { notificationPrefix } - Channel, $, { channelIndex } + 1);
    }
    Channel;
});
`
`;
if (!['slack', 'email', 'webhook', 'sms'].includes(channel.type)) {
    `
          errors.push(${notificationPrefix} - Channel ${channelIndex + 1}: Invalid channel type: ${channel.type});
        }` `
        if (!channel.configuration) {`;
    errors.push($, { notificationPrefix } - Channel, $, { channelIndex } + 1);
}
Channel;
configuration;
is;
required;
;
;
;
validateStageDependencies(stages, pipeline_1.PipelineStage[], errors, string[]);
void {
    const: stageIds = new Set(stages.map(s => s.id)),
    stages, : .forEach(stage => {
        stage.dependencies.forEach(depId => {
            `
        if (!stageIds.has(depId)) {`;
            errors.push(Stage, $, { stage, : .name }, Invalid, dependency, reference, $, { depId } `);
        }
      });
    });

    // Check for circular dependencies
    if (this.hasCircularDependencies(stages)) {
      errors.push('Circular dependencies detected in stage configuration');
    }
  }

  private validateTimeoutAndRetry(pipeline: PipelineDefinition, errors: string[]): void {
    if (pipeline.retryPolicy) {
      if (pipeline.retryPolicy.maxAttempts && pipeline.retryPolicy.maxAttempts <= 0) {
        errors.push('Retry policy max attempts must be positive');
      }

      if (pipeline.retryPolicy.initialDelay && pipeline.retryPolicy.initialDelay <= 0) {
        errors.push('Retry policy initial delay must be positive');
      }

      if (pipeline.retryPolicy.maxDelay && pipeline.retryPolicy.maxDelay <= 0) {
        errors.push('Retry policy max delay must be positive');
      }

      if (pipeline.retryPolicy.initialDelay && pipeline.retryPolicy.maxDelay &&
          pipeline.retryPolicy.initialDelay > pipeline.retryPolicy.maxDelay) {
        errors.push('Retry policy initial delay cannot be greater than max delay');
      }
    }
  }

  private validateSecurity(pipeline: PipelineDefinition, errors: string[]): void {
    // Check for potential security issues
    stages: for (const stage of pipeline.stages) {
      for (const task of stage.tasks) {
        // Check for hardcoded secrets
        if (task.command && this.containsHardcodedSecrets(task.command)) {
          errors.push(Stage ${stage.name} - Task ${task.name}: Potential hardcoded secrets detected);
        }
`);
            if (task.script && this.containsHardcodedSecrets(task.script)) {
                `
          errors.push(Stage ${stage.name}` - Task;
                $;
                {
                    task.name;
                }
                Potential;
                hardcoded;
                secrets;
                detected in script;
            }
        });
    })
    // Check for dangerous commands
    ,
    // Check for dangerous commands
    if(task) { }, : .command && this.containsDangerousCommands(task.command)
};
{
    errors.push(Stage, $, { stage, : .name } - Task, $, { task, : .name }, Potentially, dangerous, command, detected);
}
// Check for privilege escalation`
if (task.parameters && this.requiresPrivilegeEscalation(task.parameters)) {
    `
          errors.push(Stage ${stage.name}` - Task;
    $;
    {
        task.name;
    }
    Task;
    requires;
    privilege;
    escalation;
    ;
}
validateResources(pipeline, pipeline_1.PipelineDefinition, errors, string[]);
void {
    // Validate resource requirements
    if(pipeline) { }, : .environment.resources
};
{
    const resources = pipeline.environment.resources;
    if (resources.cpu && !this.isValidResourceQuantity(resources.cpu)) {
        errors.push('Invalid CPU resource specification');
    }
    if (resources.memory && !this.isValidResourceQuantity(resources.memory)) {
        errors.push('Invalid memory resource specification');
    }
    if (resources.storage && !this.isValidResourceQuantity(resources.storage)) {
        errors.push('Invalid storage resource specification');
    }
}
validateStageConditions(conditions, any[], errors, string[], stagePrefix, string);
void {
    conditions, forEach() { }
}(condition, index);
{
    `
      if (!condition.type) {`;
    errors.push($, { stagePrefix } - Condition, $, { index } + 1);
}
`: Condition type is required);
      }

      if (!condition.operator) {
        errors.push(${stagePrefix} - Condition ${index + 1}: Condition operator is required);
      }` `
      if (condition.value === undefined || condition.value === null) {`;
errors.push($, { stagePrefix } - Condition, $, { index } + 1, Condition, value, is, required);
;
validateTaskConditions(conditions, any[], errors, string[], taskPrefix, string);
void {
    conditions, forEach() { }
}(condition, index);
{
    if (!condition.type) {
        errors.push($, { taskPrefix } - Condition, $, { index } + 1);
    }
    Condition;
    ;
    `
      }` `
      if (!condition.operator) {
        errors.push(${taskPrefix} - Condition ${index + 1}: Condition operator is required);`;
}
`
`;
if (condition.value === undefined || condition.value === null) {
    errors.push($, { taskPrefix } - Condition, $, { index } + 1);
}
Condition;
value;
is;
required;
;
;
`
  private validateRetryPolicy(retryPolicy: any, errors: string[], prefix: string): void {`;
if (retryPolicy && retryPolicy.enabled) {
    `
      if (!retryPolicy.maxAttempts || retryPolicy.maxAttempts <= 0) {
        errors.push(${prefix}: Retry policy max attempts must be positive);
      }` `
      if (!retryPolicy.initialDelay || retryPolicy.initialDelay <= 0) {`;
    errors.push($, { prefix }, Retry, policy, initial, delay, must, be, positive);
}
if (retryPolicy.maxDelay && retryPolicy.maxDelay <= 0) {
    errors.push($, { prefix }, Retry, policy, max, delay, must, be, positive);
}
validateTaskArtifacts(artifacts, any[], errors, string[], taskPrefix, string);
void {} `
    artifacts?.forEach((artifact, index) => {`;
if (!artifact.name) {
    `
        errors.push(${taskPrefix} - Artifact ${index + 1}: Artifact name is required);
      }
`;
    if (!artifact.path) {
        `
        errors.push(${taskPrefix} - Artifact ${index + 1}`;
        Artifact;
        path;
        is;
        required;
        ;
    }
    if (!artifact.type) {
        errors.push($, { taskPrefix } - Artifact, $, { index } + 1);
    }
    Artifact;
    ;
}
`
      if (!['file', 'directory', 'archive'].includes(artifact.type)) {`;
errors.push(`${taskPrefix} - Artifact ${index + 1}: Invalid artifact type: ${artifact.type});
      }
    });
  }

  // Deployment validation methods

  private validateDeploymentBasics(deployment: DeploymentConfig, errors: string[]): void {
    if (!deployment.id) {
      errors.push('Deployment ID is required');
    }

    if (!deployment.environment) {
      errors.push('Deployment environment is required');
    }

    if (!deployment.services || deployment.services.length === 0) {
      errors.push('Deployment must have at least one service');
    }

    if (deployment.timeout && deployment.timeout <= 0) {
      errors.push('Deployment timeout must be positive');
    }
  }

  private validateServices(services: any[], errors: string[]): void {`, services.forEach((service, index) => {
    `
      const servicePrefix = Service ${index + 1} (${service.name || 'unnamed'}`;
}));
if (!service.name) {
    errors.push($, { servicePrefix }, Service, name, is, required);
}
`
      if (!service.image) {`;
errors.push($, { servicePrefix } `: Service image is required);
      }

      if (!service.tag) {
        errors.push(${servicePrefix}: Service tag is required);
      }
`);
if (service.replicas && service.replicas <= 0) {
    `
        errors.push(${servicePrefix}`;
    Service;
    replicas;
    must;
    be;
    positive;
    ;
}
if (service.resources) {
    if (service.resources.cpu && !this.isValidResourceQuantity(service.resources.cpu)) {
        errors.push($, { servicePrefix }, Invalid, CPU, resource, quantity);
    }
    `
        if (service.resources.memory && !this.isValidResourceQuantity(service.resources.memory)) {`;
    errors.push(`${servicePrefix}: Invalid memory resource quantity);
        }
      }
    });
  }

  private validateDeploymentStrategy(strategy: any, errors: string[]): void {
    if (!strategy.type) {
      errors.push('Deployment strategy type is required');
    }` `
    if (!Object.values(DeploymentStrategy).includes(strategy.type)) {
      errors.push(Invalid deployment strategy type: ${strategy.type}`);
}
// Validate strategy-specific parameters
switch (strategy.type) {
    case pipeline_1.DeploymentStrategy.CANARY:
        if (strategy.canaryConfig) {
            this.validateCanaryConfig(strategy.canaryConfig, errors);
        }
        break;
    case pipeline_1.DeploymentStrategy.BLUE_GREEN:
        if (strategy.blueGreenConfig) {
            this.validateBlueGreenConfig(strategy.blueGreenConfig, errors);
        }
        break;
}
validateCanaryConfig(canaryConfig, any, errors, string[]);
void {
    if(, canaryConfig) { }, : .steps || canaryConfig.steps.length === 0
};
{
    errors.push('Canary configuration must have at least one step');
}
canaryConfig.steps?.forEach((step, index) => {
    if (step.weight === undefined || step.weight < 0 || step.weight > 100) {
        errors.push(Canary, step, $, { index } + 1);
    }
    Weight;
    must;
    be;
    between;
    0;
    and;
    100;
});
if (!step.duration) {
    errors.push(Canary, step, $, { index } + 1);
}
Duration;
is;
required;
;
;
validateBlueGreenConfig(blueGreenConfig, any, errors, string[]);
void {
    if(blueGreenConfig) { }, : .scaleDownDelay && !this.isValidDuration(blueGreenConfig.scaleDownDelay)
};
{
    errors.push('Invalid scale down delay format');
}
validateHealthChecks(healthChecks, any[], errors, string[]);
void {} `
    healthChecks.forEach((healthCheck, index) => {`;
const healthCheckPrefix = Health, Check, $, { index };
+1;
`;

      if (!healthCheck.type) {
        errors.push(${healthCheckPrefix}: Health check type is required);
      }

      if (!['http', 'tcp', 'exec', 'grpc'].includes(healthCheck.type)) {
        errors.push(${healthCheckPrefix}: Invalid health check type: ${healthCheck.type});
      }` `
      if (healthCheck.type === 'http' && !healthCheck.path) {`;
errors.push($, { healthCheckPrefix }, HTTP, health, check, requires, path);
if ((healthCheck.type === 'http' || healthCheck.type === 'tcp') && !healthCheck.port) {
    `
        errors.push(${healthCheckPrefix}: ${healthCheck.type.toUpperCase()} health check requires port`;
    ;
}
if (healthCheck.type === 'exec' && (!healthCheck.command || healthCheck.command.length === 0)) {
    errors.push($, { healthCheckPrefix }, Exec, health, check, requires, command `);
      }

      if (healthCheck.initialDelaySeconds && healthCheck.initialDelaySeconds < 0) {
        errors.push(${healthCheckPrefix}: Initial delay seconds cannot be negative);
      }
`);
    if (healthCheck.periodSeconds && healthCheck.periodSeconds <= 0) {
        `
        errors.push(`;
        $;
        {
            healthCheckPrefix;
        }
        Period;
        seconds;
        must;
        be;
        positive;
        ;
    }
    if (healthCheck.timeoutSeconds && healthCheck.timeoutSeconds <= 0) {
        `
        errors.push(${healthCheckPrefix}`;
        Timeout;
        seconds;
        must;
        be;
        positive `);
      }

      if (healthCheck.failureThreshold && healthCheck.failureThreshold <= 0) {
        errors.push(${healthCheckPrefix}: Failure threshold must be positive);
      }

      if (healthCheck.successThreshold && healthCheck.successThreshold <= 0) {`;
        errors.push($, { healthCheckPrefix } `: Success threshold must be positive);
      }
    });
  }

  private validateRollbackPolicy(rollbackPolicy: any, errors: string[]): void {
    if (rollbackPolicy && rollbackPolicy.enabled) {
      if (rollbackPolicy.timeout && rollbackPolicy.timeout <= 0) {
        errors.push('Rollback policy timeout must be positive');
      }

      rollbackPolicy.triggers?.forEach((trigger: any, index: number) => {
        if (!trigger.type) {
          errors.push(Rollback trigger ${index + 1}`, Trigger, type, is, required);
    }
    if (!['health_check', 'metric', 'manual', 'timeout'].includes(trigger.type)) {
        errors.push(Rollback, trigger, $, { index } + 1);
    }
    Invalid;
    trigger;
    type: $;
    {
        trigger.type;
    }
    ;
}
if (trigger.type === 'metric' && !trigger.metric) {
    `
          errors.push(Rollback trigger ${index + 1}: Metric trigger requires metric name`;
    ;
}
if (trigger.threshold !== undefined && trigger.threshold < 0) {
    errors.push(Rollback, trigger, $, { index } + 1);
}
Threshold;
cannot;
be;
negative;
;
;
validateApprovals(approvals, any[], errors, string[]);
void {
    approvals, : .forEach((approval, index) => {
        const approvalPrefix = Approval, $, { index };
        +1;
    })
} `
`;
if (approval.required && (!approval.approvers || approval.approvers.length === 0)) {
    errors.push($, { approvalPrefix } `: Required approval must have at least one approver);
      }

      if (approval.minApprovals && approval.minApprovals <= 0) {
        errors.push(${approvalPrefix}: Minimum approvals must be positive);
      }` `
      if (approval.timeout && approval.timeout <= 0) {
        errors.push(`, $, { approvalPrefix }, Approval, timeout, must, be, positive);
}
if (approval.minApprovals && approval.approvers && `
          approval.minApprovals > approval.approvers.length) {`)
    errors.push($, { approvalPrefix }, Minimum, approvals, cannot, exceed, number, of, approvers `);
      }
    });
  }

  // Helper methods

  private hasCircularDependencies(stages: PipelineStage[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (stageId: string): boolean => {
      if (recursionStack.has(stageId)) {
        return true;
      }

      if (visited.has(stageId)) {
        return false;
      }

      visited.add(stageId);
      recursionStack.add(stageId);

      const stage = stages.find(s => s.id === stageId);
      if (stage) {
        for (const depId of stage.dependencies) {
          if (hasCycle(depId)) {
            return true;
          }
        }
      }

      recursionStack.delete(stageId);
      return false;
    };

    for (const stage of stages) {
      if (hasCycle(stage.id)) {
        return true;
      }
    }

    return false;
  }

  private isValidResourceQuantity(quantity: string): boolean {
    // Validate Kubernetes resource quantity format (e.g., "100m", "1Gi", "500Mi")
    const resourceRegex = /^(\d+(\.\d+)?)(m|Ki|Mi|Gi|Ti|Pi|Ei|k|M|G|T|P|E)?$/;
    return resourceRegex.test(quantity);
  }

  private isValidDuration(duration: string): boolean {
    // Validate duration format (e.g., "30s", "5m", "1h")
    const durationRegex = /^(\d+)(s|m|h|d)$/;
    return durationRegex.test(duration);
  }

  private containsHardcodedSecrets(text: string): boolean {
    // Simple check for potential hardcoded secrets
    const secretPatterns = [
      /password\s*=\s*["'][^"']+["']/i,
      /token\s*=\s*["'][^"']+["']/i,
      /key\s*=\s*["'][^"']+["']/i,
      /secret\s*=\s*["'][^"']+["']/i,
      /api[_-]?key\s*=\s*["'][^"']+["']/i
    ];

    return secretPatterns.some(pattern => pattern.test(text));
  }

  private containsDangerousCommands(command: string): boolean {
    // Check for potentially dangerous commands
    const dangerousCommands = [
      'rm -rf /',
      'dd if=',
      'mkfs',
      'fdisk',
      'format',
      'shutdown',
      'reboot',
      'halt',
      'init 0',
      'init 6'
    ];

    return dangerousCommands.some(dangerous => command.toLowerCase().includes(dangerous));
  }

  private requiresPrivilegeEscalation(parameters: any): boolean {
    // Check if task parameters require privilege escalation
    return parameters.privileged === true ||
           parameters.runAsRoot === true ||
           parameters.capabilities?.includes('SYS_ADMIN') ||
           parameters.securityContext?.privileged === true;
  }
});
//# sourceMappingURL=PipelineValidator.js.map