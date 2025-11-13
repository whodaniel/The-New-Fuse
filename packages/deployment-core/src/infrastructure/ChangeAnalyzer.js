"use strict";
/**
 * Change Analyzer
 * Analyzes infrastructure changes and creates execution plans
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeAnalyzer = void 0;
const infrastructure_1 = require("../types/infrastructure");
class ChangeAnalyzer {
    riskAnalyzer;
    costEstimator;
    timelineCalculator;
    constructor() {
        this.riskAnalyzer = new RiskAnalyzer();
        this.costEstimator = new CostEstimator();
        this.timelineCalculator = new TimelineCalculator();
    }
    async analyzeChanges(currentState, update) {
        try {
            const changes = [];
            // Analyze template changes
            if (update.templateChanges) {
                const templateChanges = await this.analyzeTemplateChanges(currentState, update.templateChanges);
                changes.push(...templateChanges);
            }
            // Analyze variable changes
            if (update.variableChanges) {
                const variableChanges = await this.analyzeVariableChanges(currentState, update.variableChanges);
                changes.push(...variableChanges);
            }
            // Analyze resource changes
            if (update.resourceChanges) {
                const resourceChanges = await this.analyzeResourceChanges(currentState, update.resourceChanges);
                changes.push(...resourceChanges);
            }
            // Optimize change order
            return this.optimizeChangeOrder(changes);
        }
        catch (error) {
            throw new Error(`Change analysis failed: ${error instanceof Error ? error.message : 'Unknown error'});
    }
  }

  async planChanges(changes: InfrastructureChange[]): Promise<PlanResult> {
    try {
      const planId = this.generatePlanId();

      // Perform risk assessment
      const riskAssessment = await this.riskAnalyzer.assessRisk(changes);

      // Estimate costs
      const costEstimate = await this.costEstimator.estimateCost(changes);

      // Calculate timeline
      const timeline = await this.timelineCalculator.calculateTimeline(changes);

      return {
        planId,
        changes,
        riskAssessment,
        estimatedCost: costEstimate,
        timeline
      };

    } catch (error) {`);
            throw new Error(`Change planning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async analyzeTemplateChanges(currentState, templateChanges) {
        const changes = [];
        // Analyze metadata changes
        if (templateChanges.metadata) {
            changes.push({
                action: infrastructure_1.ChangeAction.UPDATE,
                resourceName: 'template-metadata',
                resourceType: infrastructure_1.ResourceType.COMPUTE, // Generic type for template changes
                before: { metadata: 'current' },
                after: { metadata: templateChanges.metadata },
                reason: 'Template metadata update'
            });
        }
        // Analyze provider changes
        if (templateChanges.provider) {
            changes.push({
                action: infrastructure_1.ChangeAction.REPLACE,
                resourceName: 'infrastructure-provider',
                resourceType: infrastructure_1.ResourceType.COMPUTE,
                before: { provider: 'current' },
                after: { provider: templateChanges.provider },
                reason: 'Provider change requires infrastructure replacement'
            });
        }
        return changes;
    }
    async analyzeVariableChanges(currentState, variableChanges) {
        const changes = [];
        for (const [variableName, newValue] of Object.entries(variableChanges)) {
            // Determine impact of variable change
            const impactedResources = this.findResourcesUsingVariable(currentState, variableName);
            for (const resourceName of impactedResources) {
                const changeAction = this.determineChangeAction(variableName, newValue);
                changes.push({
                    action: changeAction,
                    resourceName,
                    resourceType: infrastructure_1.ResourceType.COMPUTE, // Would be determined from actual resource
                    before: { [variableName]: 'current_value' },
                    after: { [variableName]: newValue },
                    reason: Variable, $
                }, { variableName }, changed);
            }
            ;
        }
    }
}
exports.ChangeAnalyzer = ChangeAnalyzer;
return changes;
async;
analyzeResourceChanges(currentState, infrastructure_1.InfrastructureState, resourceChanges, any[]);
Promise < infrastructure_1.InfrastructureChange[] > {
    const: changes, InfrastructureChange: infrastructure_1.InfrastructureChange, []:  = [],
    const: currentResources = new Map(currentState.resources.map(r => [r.name, r])),
    for(, newResource, of, resourceChanges) {
        const currentResource = currentResources.get(newResource.name);
        if (!currentResource) {
            // New resource
            changes.push({
                action: infrastructure_1.ChangeAction.CREATE,
                resourceName: newResource.name,
                resourceType: newResource.type,
                after: newResource.properties,
                reason: 'New resource added'
            });
        }
        else {
            // Compare existing resource
            const resourceChanges = this.compareResources(currentResource, newResource);
            if (resourceChanges.length > 0) {
                changes.push(...resourceChanges);
            }
        }
    }
    // Check for deleted resources
    ,
    // Check for deleted resources
    const: newResourceNames = new Set(resourceChanges.map(r => r.name)),
    for(, currentResource, of, currentState) { }, : .resources
};
{
    if (!newResourceNames.has(currentResource.name)) {
        changes.push({
            action: infrastructure_1.ChangeAction.DELETE,
            resourceName: currentResource.name,
            resourceType: currentResource.type,
            before: currentResource.properties,
            reason: 'Resource removed'
        });
    }
}
return changes;
compareResources(currentResource, any, newResource, any);
infrastructure_1.InfrastructureChange[];
{
    const changes = [];
    // Compare properties
    const propertyChanges = this.compareObjects(currentResource.properties, newResource.properties);
    if (propertyChanges.length > 0) {
        const requiresReplacement = this.requiresReplacement(currentResource.type, propertyChanges);
        changes.push({
            action: requiresReplacement ? infrastructure_1.ChangeAction.REPLACE : infrastructure_1.ChangeAction.UPDATE,
            resourceName: currentResource.name,
            resourceType: currentResource.type,
            before: currentResource.properties,
            after: newResource.properties,
            reason: requiresReplacement
                ? 'Property changes require resource replacement'
                : 'Resource properties updated'
        });
    }
    return changes;
}
compareObjects(obj1, any, obj2, any);
string[];
{
    const changes = [];
    const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
    for (const key of allKeys) {
        const val1 = obj1?.[key];
        const val2 = obj2?.[key];
        if (JSON.stringify(val1) !== JSON.stringify(val2)) {
            changes.push(key);
        }
    }
    return changes;
}
requiresReplacement(resourceType, infrastructure_1.ResourceType, changedProperties, string[]);
boolean;
{
    // Define properties that require replacement for each GCP resource type
    const replacementProperties = {
        [infrastructure_1.ResourceType.COMPUTE]: ['type', 'configuration'],
        [infrastructure_1.ResourceType.STORAGE]: ['type', 'location'],
        [infrastructure_1.ResourceType.NETWORK]: ['configuration'],
        [infrastructure_1.ResourceType.DATABASE]: ['version', 'configuration'],
        [infrastructure_1.ResourceType.SECURITY_GROUP]: ['rules'],
        [infrastructure_1.ResourceType.COMPUTE_ENGINE]: ['machineType', 'zone', 'subnetwork'],
        [infrastructure_1.ResourceType.CLOUD_STORAGE]: ['location', 'storageClass'],
        [infrastructure_1.ResourceType.VPC_NETWORK]: ['autoCreateSubnetworks'],
        [infrastructure_1.ResourceType.CLOUD_SQL]: ['databaseVersion', 'tier', 'region'],
        [infrastructure_1.ResourceType.LOAD_BALANCER]: ['loadBalancingScheme'],
        [infrastructure_1.ResourceType.FIREWALL_RULE]: ['network'],
        [infrastructure_1.ResourceType.IAM_ROLE]: ['stage'],
        [infrastructure_1.ResourceType.CLOUD_DNS]: ['dnsName'],
        [infrastructure_1.ResourceType.SSL_CERTIFICATE]: ['domains'],
        [infrastructure_1.ResourceType.CONTAINER_REGISTRY]: ['location'],
        [infrastructure_1.ResourceType.GKE_CLUSTER]: ['location', 'network'],
        [infrastructure_1.ResourceType.CLOUD_FUNCTION]: ['runtime', 'region']
    };
    const replacementProps = replacementProperties[resourceType] || [];
    return changedProperties.some(prop => replacementProps.includes(prop));
}
findResourcesUsingVariable(state, infrastructure_1.InfrastructureState, variableName, string);
string[];
{
    const resourceNames = [];
    for (const resource of state.resources) {
        const resourceStr = JSON.stringify(resource.properties);
        // Check for variable references or if the variable name matches a property`
        if (resourceStr.includes($, { $ }, { variableName } `) || 
          resource.properties.hasOwnProperty(variableName)) {
        resourceNames.push(resource.name);
      }
    }

    // If no resources found, assume all resources might be affected
    if (resourceNames.length === 0 && state.resources.length > 0) {
      return state.resources.map(r => r.name);
    }

    return resourceNames;
  }

  private determineChangeAction(variableName: string, _newValue: any): ChangeAction {
    // Determine if variable change requires replacement or just update
    const replacementVariables = ['region', 'availabilityZone', 'instanceType'];
    
    if (replacementVariables.includes(variableName)) {
      return ChangeAction.REPLACE;
    }

    return ChangeAction.UPDATE;
  }

  private optimizeChangeOrder(changes: InfrastructureChange[]): InfrastructureChange[] {
    // Sort changes by priority and dependencies
    const priorityOrder = [
      ChangeAction.DELETE,
      ChangeAction.REPLACE,
      ChangeAction.CREATE,
      ChangeAction.UPDATE,
      ChangeAction.NO_CHANGE
    ];

    return changes.sort((a, b) => {
      const aPriority = priorityOrder.indexOf(a.action);
      const bPriority = priorityOrder.indexOf(b.action);
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Secondary sort by resource type criticality
      const criticalTypes = [ResourceType.NETWORK, ResourceType.SECURITY_GROUP, ResourceType.IAM_ROLE];
      const aIsCritical = criticalTypes.includes(a.resourceType);
      const bIsCritical = criticalTypes.includes(b.resourceType);

      if (aIsCritical && !bIsCritical) return -1;
      if (!aIsCritical && bIsCritical) return 1;

      return 0;
    });
  }

  private generatePlanId(): string {
    return plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)};
  }
}

class RiskAnalyzer {
  async assessRisk(changes: InfrastructureChange[]): Promise<RiskAssessment> {
    const riskFactors: RiskFactor[] = [];
    let overallRisk = RiskLevel.LOW;

    for (const change of changes) {
      const changeRisks = this.analyzeChangeRisk(change);
      riskFactors.push(...changeRisks);
    }

    // Determine overall risk level
    if (riskFactors.some(f => f.impact === ImpactLevel.CRITICAL)) {
      overallRisk = RiskLevel.CRITICAL;
    } else if (riskFactors.some(f => f.impact === ImpactLevel.HIGH)) {
      overallRisk = RiskLevel.HIGH;
    } else if (riskFactors.some(f => f.impact === ImpactLevel.MEDIUM)) {
      overallRisk = RiskLevel.MEDIUM;
    }

    return {
      level: overallRisk,
      factors: riskFactors,
      mitigation: this.generateMitigationStrategies(riskFactors)
    };
  }

  private analyzeChangeRisk(change: InfrastructureChange): RiskFactor[] {
    const risks: RiskFactor[] = [];

    // Analyze action-specific risks
    switch (change.action) {`, infrastructure_1.ChangeAction.DELETE, `
        risks.push({
          type: RiskType.DOWNTIME,
          description: `, Deleting, $, { change, : .resourceName }, may, cause, service, disruption, impact, this.getResourceImpact(change.resourceType), probability, infrastructure_1.ProbabilityLevel.CERTAIN))
            ;
    }
    ;
    break;
    infrastructure_1.ChangeAction.REPLACE;
    `
        risks.push({`;
    type: infrastructure_1.RiskType.DOWNTIME,
        description;
    Replacing;
    $;
    {
        change.resourceName;
    }
    will;
    cause;
    temporary;
    downtime `,
          impact: this.getResourceImpact(change.resourceType),
          probability: ProbabilityLevel.LIKELY
        });
        break;

      case ChangeAction.UPDATE:
        risks.push({
          type: RiskType.PERFORMANCE,
          description: Updating ${change.resourceName} may affect performance`,
        impact;
    infrastructure_1.ImpactLevel.LOW,
        probability;
    infrastructure_1.ProbabilityLevel.POSSIBLE;
}
;
break;
// Analyze resource-specific risks
if (change.resourceType === infrastructure_1.ResourceType.CLOUD_SQL) {
    risks.push({
        type: infrastructure_1.RiskType.DATA_LOSS,
        description: 'Cloud SQL changes carry risk of data loss',
        impact: infrastructure_1.ImpactLevel.CRITICAL,
        probability: infrastructure_1.ProbabilityLevel.UNLIKELY
    });
}
if (change.resourceType === infrastructure_1.ResourceType.FIREWALL_RULE) {
    risks.push({
        type: infrastructure_1.RiskType.SECURITY,
        description: 'Firewall rule changes may affect access controls',
        impact: infrastructure_1.ImpactLevel.HIGH,
        probability: infrastructure_1.ProbabilityLevel.POSSIBLE
    });
}
return risks;
getResourceImpact(resourceType, infrastructure_1.ResourceType);
infrastructure_1.ImpactLevel;
{
    const impactMap = {
        [infrastructure_1.ResourceType.COMPUTE]: infrastructure_1.ImpactLevel.HIGH,
        [infrastructure_1.ResourceType.STORAGE]: infrastructure_1.ImpactLevel.MEDIUM,
        [infrastructure_1.ResourceType.NETWORK]: infrastructure_1.ImpactLevel.CRITICAL,
        [infrastructure_1.ResourceType.DATABASE]: infrastructure_1.ImpactLevel.CRITICAL,
        [infrastructure_1.ResourceType.SECURITY_GROUP]: infrastructure_1.ImpactLevel.HIGH,
        [infrastructure_1.ResourceType.COMPUTE_ENGINE]: infrastructure_1.ImpactLevel.HIGH,
        [infrastructure_1.ResourceType.CLOUD_STORAGE]: infrastructure_1.ImpactLevel.MEDIUM,
        [infrastructure_1.ResourceType.VPC_NETWORK]: infrastructure_1.ImpactLevel.CRITICAL,
        [infrastructure_1.ResourceType.CLOUD_SQL]: infrastructure_1.ImpactLevel.CRITICAL,
        [infrastructure_1.ResourceType.LOAD_BALANCER]: infrastructure_1.ImpactLevel.HIGH,
        [infrastructure_1.ResourceType.FIREWALL_RULE]: infrastructure_1.ImpactLevel.HIGH,
        [infrastructure_1.ResourceType.IAM_ROLE]: infrastructure_1.ImpactLevel.MEDIUM,
        [infrastructure_1.ResourceType.CLOUD_DNS]: infrastructure_1.ImpactLevel.MEDIUM,
        [infrastructure_1.ResourceType.SSL_CERTIFICATE]: infrastructure_1.ImpactLevel.LOW,
        [infrastructure_1.ResourceType.CONTAINER_REGISTRY]: infrastructure_1.ImpactLevel.LOW,
        [infrastructure_1.ResourceType.GKE_CLUSTER]: infrastructure_1.ImpactLevel.CRITICAL,
        [infrastructure_1.ResourceType.CLOUD_FUNCTION]: infrastructure_1.ImpactLevel.MEDIUM
    };
    return impactMap[resourceType] || infrastructure_1.ImpactLevel.MEDIUM;
}
generateMitigationStrategies(riskFactors, infrastructure_1.RiskFactor[]);
string[];
{
    const strategies = [];
    if (riskFactors.some(f => f.type === infrastructure_1.RiskType.DOWNTIME)) {
        strategies.push('Schedule changes during maintenance window');
        strategies.push('Implement blue-green deployment strategy');
        strategies.push('Prepare rollback procedures');
    }
    if (riskFactors.some(f => f.type === infrastructure_1.RiskType.DATA_LOSS)) {
        strategies.push('Create backup before making changes');
        strategies.push('Test changes in non-production environment first');
        strategies.push('Implement point-in-time recovery');
    }
    if (riskFactors.some(f => f.type === infrastructure_1.RiskType.SECURITY)) {
        strategies.push('Review security group rules carefully');
        strategies.push('Test access controls after changes');
        strategies.push('Monitor for unauthorized access');
    }
    return strategies;
}
class CostEstimator {
    async estimateCost(changes) {
        const breakdown = [];
        let totalMonthlyCost = 0;
        for (const change of changes) {
            const changeCost = this.estimateChangeCost(change);
            if (changeCost > 0) {
                breakdown.push({
                    resourceType: change.resourceType,
                    resourceName: change.resourceName,
                    monthlyCost: changeCost,
                    yearlyCost: changeCost * 12
                });
                totalMonthlyCost += changeCost;
            }
        }
        return {
            currency: 'USD',
            monthly: totalMonthlyCost,
            yearly: totalMonthlyCost * 12,
            breakdown
        };
    }
    estimateChangeCost(change) {
        // Simple cost estimation - in production, this would integrate with GCP pricing APIs
        const baseCosts = {
            [infrastructure_1.ResourceType.COMPUTE]: 50,
            [infrastructure_1.ResourceType.STORAGE]: 10,
            [infrastructure_1.ResourceType.NETWORK]: 0,
            [infrastructure_1.ResourceType.DATABASE]: 100,
            [infrastructure_1.ResourceType.SECURITY_GROUP]: 0,
            [infrastructure_1.ResourceType.COMPUTE_ENGINE]: 50,
            [infrastructure_1.ResourceType.CLOUD_STORAGE]: 10,
            [infrastructure_1.ResourceType.VPC_NETWORK]: 0,
            [infrastructure_1.ResourceType.CLOUD_SQL]: 100,
            [infrastructure_1.ResourceType.LOAD_BALANCER]: 25,
            [infrastructure_1.ResourceType.FIREWALL_RULE]: 0,
            [infrastructure_1.ResourceType.IAM_ROLE]: 0,
            [infrastructure_1.ResourceType.CLOUD_DNS]: 1,
            [infrastructure_1.ResourceType.SSL_CERTIFICATE]: 0,
            [infrastructure_1.ResourceType.CONTAINER_REGISTRY]: 5,
            [infrastructure_1.ResourceType.GKE_CLUSTER]: 75,
            [infrastructure_1.ResourceType.CLOUD_FUNCTION]: 5
        };
        const baseCost = baseCosts[change.resourceType] || 0;
        switch (change.action) {
            case infrastructure_1.ChangeAction.CREATE:
                return baseCost;
            case infrastructure_1.ChangeAction.DELETE:
                return -baseCost;
            case infrastructure_1.ChangeAction.REPLACE:
                return 0; // No net cost change
            case infrastructure_1.ChangeAction.UPDATE:
                return baseCost * 0.1; // Small cost for updates
            default:
                return 0;
        }
    }
}
class TimelineCalculator {
    async calculateTimeline(changes) {
        const phases = this.createExecutionPhases(changes);
        const dependencies = this.calculateDependencies(phases);
        const totalDuration = this.calculateTotalDuration(phases, dependencies);
        return {
            estimatedDuration: totalDuration,
            phases,
            dependencies
        };
    }
    createExecutionPhases(changes) {
        const phases = [];
        // Group changes by action type
        const deleteChanges = changes.filter(c => c.action === infrastructure_1.ChangeAction.DELETE);
        const replaceChanges = changes.filter(c => c.action === infrastructure_1.ChangeAction.REPLACE);
        const createChanges = changes.filter(c => c.action === infrastructure_1.ChangeAction.CREATE);
        const updateChanges = changes.filter(c => c.action === infrastructure_1.ChangeAction.UPDATE);
        if (deleteChanges.length > 0) {
            phases.push({
                name: 'Delete Resources',
                duration: this.estimatePhaseDuration(deleteChanges),
                resources: deleteChanges.map(c => c.resourceName),
                parallelizable: true
            });
        }
        if (replaceChanges.length > 0) {
            phases.push({
                name: 'Replace Resources',
                duration: this.estimatePhaseDuration(replaceChanges),
                resources: replaceChanges.map(c => c.resourceName),
                parallelizable: false
            });
        }
        if (createChanges.length > 0) {
            phases.push({
                name: 'Create Resources',
                duration: this.estimatePhaseDuration(createChanges),
                resources: createChanges.map(c => c.resourceName),
                parallelizable: true
            });
        }
        if (updateChanges.length > 0) {
            phases.push({
                name: 'Update Resources',
                duration: this.estimatePhaseDuration(updateChanges),
                resources: updateChanges.map(c => c.resourceName),
                parallelizable: true
            });
        }
        return phases;
    }
    calculateDependencies(phases) {
        const dependencies = [];
        // Create dependencies based on phase order
        for (let i = 1; i < phases.length; i++) {
            dependencies.push({
                phase: phases[i].name,
                dependsOn: [phases[i - 1].name],
                type: infrastructure_1.DependencyType.HARD
            });
        }
        return dependencies;
    }
    calculateTotalDuration(phases, _dependencies) {
        // Simple sequential calculation - in production, would consider parallelization
        return phases.reduce((total, phase) => total + phase.duration, 0);
    }
    estimatePhaseDuration(changes) {
        // Estimate duration based on GCP resource types and actions
        const baseDurations = {
            [infrastructure_1.ResourceType.COMPUTE]: 300, // 5 minutes
            [infrastructure_1.ResourceType.STORAGE]: 60, // 1 minute
            [infrastructure_1.ResourceType.NETWORK]: 120, // 2 minutes
            [infrastructure_1.ResourceType.DATABASE]: 900, // 15 minutes
            [infrastructure_1.ResourceType.SECURITY_GROUP]: 30, // 30 seconds
            [infrastructure_1.ResourceType.COMPUTE_ENGINE]: 300, // 5 minutes
            [infrastructure_1.ResourceType.CLOUD_STORAGE]: 60, // 1 minute
            [infrastructure_1.ResourceType.VPC_NETWORK]: 120, // 2 minutes
            [infrastructure_1.ResourceType.CLOUD_SQL]: 900, // 15 minutes
            [infrastructure_1.ResourceType.LOAD_BALANCER]: 240, // 4 minutes
            [infrastructure_1.ResourceType.FIREWALL_RULE]: 30, // 30 seconds
            [infrastructure_1.ResourceType.IAM_ROLE]: 30, // 30 seconds
            [infrastructure_1.ResourceType.CLOUD_DNS]: 60, // 1 minute
            [infrastructure_1.ResourceType.SSL_CERTIFICATE]: 300, // 5 minutes
            [infrastructure_1.ResourceType.CONTAINER_REGISTRY]: 60, // 1 minute
            [infrastructure_1.ResourceType.GKE_CLUSTER]: 600, // 10 minutes
            [infrastructure_1.ResourceType.CLOUD_FUNCTION]: 120 // 2 minutes
        };
        let totalDuration = 0;
        for (const change of changes) {
            const baseDuration = baseDurations[change.resourceType] || 120;
            // Adjust duration based on action
            let actionMultiplier = 1;
            switch (change.action) {
                case infrastructure_1.ChangeAction.CREATE:
                    actionMultiplier = 1;
                    break;
                case infrastructure_1.ChangeAction.UPDATE:
                    actionMultiplier = 0.5;
                    break;
                case infrastructure_1.ChangeAction.DELETE:
                    actionMultiplier = 0.3;
                    break;
                case infrastructure_1.ChangeAction.REPLACE:
                    actionMultiplier = 1.5;
                    break;
            }
            totalDuration += baseDuration * actionMultiplier;
        }
        return Math.ceil(totalDuration);
    }
}
//# sourceMappingURL=ChangeAnalyzer.js.map