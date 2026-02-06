/**
 * Change Analyzer
 * Analyzes infrastructure changes and creates execution plans
 */

import {
  ChangeAction,
  CostBreakdown,
  CostEstimate,
  DependencyType,
  ExecutionPhase,
  ExecutionTimeline,
  ImpactLevel,
  InfrastructureChange,
  InfrastructureState,
  InfrastructureUpdate,
  PhaseDependency,
  PlanResult,
  ProbabilityLevel,
  ResourceType,
  RiskAssessment,
  RiskFactor,
  RiskLevel,
  RiskType,
} from '../types/infrastructure';

export class ChangeAnalyzer {
  private riskAnalyzer: RiskAnalyzer;
  private costEstimator: CostEstimator;
  private timelineCalculator: TimelineCalculator;

  constructor() {
    this.riskAnalyzer = new RiskAnalyzer();
    this.costEstimator = new CostEstimator();
    this.timelineCalculator = new TimelineCalculator();
  }

  async analyzeChanges(
    currentState: InfrastructureState,
    update: InfrastructureUpdate
  ): Promise<InfrastructureChange[]> {
    try {
      const changes: InfrastructureChange[] = [];

      // Analyze template changes
      if (update.templateChanges) {
        const templateChanges = await this.analyzeTemplateChanges(
          currentState,
          update.templateChanges
        );
        changes.push(...templateChanges);
      }

      // Analyze variable changes
      if (update.variableChanges) {
        const variableChanges = await this.analyzeVariableChanges(
          currentState,
          update.variableChanges
        );
        changes.push(...variableChanges);
      }

      // Analyze resource changes
      if (update.resourceChanges) {
        const resourceChanges = await this.analyzeResourceChanges(
          currentState,
          update.resourceChanges
        );
        changes.push(...resourceChanges);
      }

      // Optimize change order
      return this.optimizeChangeOrder(changes);
    } catch (error) {
      throw new Error(
        `Change analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
        timeline,
      };
    } catch (error) {
      throw new Error(
        `Change planning failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async analyzeTemplateChanges(
    currentState: InfrastructureState,
    templateChanges: any
  ): Promise<InfrastructureChange[]> {
    const changes: InfrastructureChange[] = [];

    // Analyze metadata changes
    if (templateChanges.metadata) {
      changes.push({
        action: ChangeAction.UPDATE,
        resourceName: 'template-metadata',
        resourceType: ResourceType.COMPUTE, // Generic type for template changes
        before: { metadata: 'current' },
        after: { metadata: templateChanges.metadata },
        reason: 'Template metadata update',
      });
    }

    // Analyze provider changes
    if (templateChanges.provider) {
      changes.push({
        action: ChangeAction.REPLACE,
        resourceName: 'infrastructure-provider',
        resourceType: ResourceType.COMPUTE,
        before: { provider: 'current' },
        after: { provider: templateChanges.provider },
        reason: 'Provider change requires infrastructure replacement',
      });
    }

    return changes;
  }

  private async analyzeVariableChanges(
    currentState: InfrastructureState,
    variableChanges: Record<string, any>
  ): Promise<InfrastructureChange[]> {
    const changes: InfrastructureChange[] = [];

    for (const [variableName, newValue] of Object.entries(variableChanges)) {
      // Determine impact of variable change
      const impactedResources = this.findResourcesUsingVariable(currentState, variableName);

      for (const resourceName of impactedResources) {
        const changeAction = this.determineChangeAction(variableName, newValue);

        changes.push({
          action: changeAction,
          resourceName,
          resourceType: ResourceType.COMPUTE, // Would be determined from actual resource
          before: { [variableName]: 'current_value' },
          after: { [variableName]: newValue },
          reason: `Variable ${variableName} changed`,
        });
      }
    }

    return changes;
  }

  private async analyzeResourceChanges(
    currentState: InfrastructureState,
    resourceChanges: any[]
  ): Promise<InfrastructureChange[]> {
    const changes: InfrastructureChange[] = [];
    const currentResources = new Map(currentState.resources.map((r) => [r.name, r]));

    for (const newResource of resourceChanges) {
      const currentResource = currentResources.get(newResource.name);

      if (!currentResource) {
        // New resource
        changes.push({
          action: ChangeAction.CREATE,
          resourceName: newResource.name,
          resourceType: newResource.type,
          after: newResource.properties,
          reason: 'New resource added',
        });
      } else {
        // Compare existing resource
        const resourceChanges = this.compareResources(currentResource, newResource);
        if (resourceChanges.length > 0) {
          changes.push(...resourceChanges);
        }
      }
    }

    // Check for deleted resources
    const newResourceNames = new Set(resourceChanges.map((r) => r.name));
    for (const currentResource of currentState.resources) {
      if (!newResourceNames.has(currentResource.name)) {
        changes.push({
          action: ChangeAction.DELETE,
          resourceName: currentResource.name,
          resourceType: currentResource.type,
          before: currentResource.properties,
          reason: 'Resource removed',
        });
      }
    }

    return changes;
  }

  private compareResources(currentResource: any, newResource: any): InfrastructureChange[] {
    const changes: InfrastructureChange[] = [];

    // Compare properties
    const propertyChanges = this.compareObjects(currentResource.properties, newResource.properties);

    if (propertyChanges.length > 0) {
      const requiresReplacement = this.requiresReplacement(currentResource.type, propertyChanges);

      changes.push({
        action: requiresReplacement ? ChangeAction.REPLACE : ChangeAction.UPDATE,
        resourceName: currentResource.name,
        resourceType: currentResource.type,
        before: currentResource.properties,
        after: newResource.properties,
        reason: requiresReplacement
          ? 'Property changes require resource replacement'
          : 'Resource properties updated',
      });
    }

    return changes;
  }

  private compareObjects(obj1: any, obj2: any): string[] {
    const changes: string[] = [];
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

  private requiresReplacement(resourceType: ResourceType, changedProperties: string[]): boolean {
    // Define properties that require replacement for each GCP resource type
    const replacementProperties: Record<ResourceType, string[]> = {
      [ResourceType.COMPUTE]: ['type', 'configuration'],
      [ResourceType.STORAGE]: ['type', 'location'],
      [ResourceType.NETWORK]: ['configuration'],
      [ResourceType.DATABASE]: ['version', 'configuration'],
      [ResourceType.SECURITY_GROUP]: ['rules'],
      [ResourceType.COMPUTE_ENGINE]: ['machineType', 'zone', 'subnetwork'],
      [ResourceType.CLOUD_STORAGE]: ['location', 'storageClass'],
      [ResourceType.VPC_NETWORK]: ['autoCreateSubnetworks'],
      [ResourceType.CLOUD_SQL]: ['databaseVersion', 'tier', 'region'],
      [ResourceType.LOAD_BALANCER]: ['loadBalancingScheme'],
      [ResourceType.FIREWALL_RULE]: ['network'],
      [ResourceType.IAM_ROLE]: ['stage'],
      [ResourceType.CLOUD_DNS]: ['dnsName'],
      [ResourceType.SSL_CERTIFICATE]: ['domains'],
      [ResourceType.CONTAINER_REGISTRY]: ['location'],
      [ResourceType.GKE_CLUSTER]: ['location', 'network'],
      [ResourceType.CLOUD_FUNCTION]: ['runtime', 'region'],
    };

    const replacementProps = replacementProperties[resourceType] || [];
    return changedProperties.some((prop) => replacementProps.includes(prop));
  }

  private findResourcesUsingVariable(state: InfrastructureState, variableName: string): string[] {
    const resourceNames: string[] = [];

    for (const resource of state.resources) {
      const resourceStr = JSON.stringify(resource.properties);
      // Check for variable references or if the variable name matches a property
      if (
        resourceStr.includes(`\${${variableName}}`) ||
        resource.properties.hasOwnProperty(variableName)
      ) {
        resourceNames.push(resource.name);
      }
    }

    // If no resources found, assume all resources might be affected
    if (resourceNames.length === 0 && state.resources.length > 0) {
      return state.resources.map((r) => r.name);
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
      ChangeAction.NO_CHANGE,
    ];

    return changes.sort((a, b) => {
      const aPriority = priorityOrder.indexOf(a.action);
      const bPriority = priorityOrder.indexOf(b.action);

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Secondary sort by resource type criticality
      const criticalTypes = [
        ResourceType.NETWORK,
        ResourceType.SECURITY_GROUP,
        ResourceType.IAM_ROLE,
      ];
      const aIsCritical = criticalTypes.includes(a.resourceType);
      const bIsCritical = criticalTypes.includes(b.resourceType);

      if (aIsCritical && !bIsCritical) return -1;
      if (!aIsCritical && bIsCritical) return 1;

      return 0;
    });
  }

  private generatePlanId(): string {
    return `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
    if (riskFactors.some((f) => f.impact === ImpactLevel.CRITICAL)) {
      overallRisk = RiskLevel.CRITICAL;
    } else if (riskFactors.some((f) => f.impact === ImpactLevel.HIGH)) {
      overallRisk = RiskLevel.HIGH;
    } else if (riskFactors.some((f) => f.impact === ImpactLevel.MEDIUM)) {
      overallRisk = RiskLevel.MEDIUM;
    }

    return {
      level: overallRisk,
      factors: riskFactors,
      mitigation: this.generateMitigationStrategies(riskFactors),
    };
  }

  private analyzeChangeRisk(change: InfrastructureChange): RiskFactor[] {
    const risks: RiskFactor[] = [];

    // Analyze action-specific risks
    switch (change.action) {
      case ChangeAction.DELETE:
        risks.push({
          type: RiskType.DOWNTIME,
          description: `Deleting ${change.resourceName} may cause service disruption`,
          impact: this.getResourceImpact(change.resourceType),
          probability: ProbabilityLevel.CERTAIN,
        });
        break;

      case ChangeAction.REPLACE:
        risks.push({
          type: RiskType.DOWNTIME,
          description: `Replacing ${change.resourceName} will cause temporary downtime`,
          impact: this.getResourceImpact(change.resourceType),
          probability: ProbabilityLevel.LIKELY,
        });
        break;

      case ChangeAction.UPDATE:
        risks.push({
          type: RiskType.PERFORMANCE,
          description: `Updating ${change.resourceName} may affect performance`,
          impact: ImpactLevel.LOW,
          probability: ProbabilityLevel.POSSIBLE,
        });
        break;
    }

    // Analyze resource-specific risks
    if (change.resourceType === ResourceType.CLOUD_SQL) {
      risks.push({
        type: RiskType.DATA_LOSS,
        description: 'Cloud SQL changes carry risk of data loss',
        impact: ImpactLevel.CRITICAL,
        probability: ProbabilityLevel.UNLIKELY,
      });
    }

    if (change.resourceType === ResourceType.FIREWALL_RULE) {
      risks.push({
        type: RiskType.SECURITY,
        description: 'Firewall rule changes may affect access controls',
        impact: ImpactLevel.HIGH,
        probability: ProbabilityLevel.POSSIBLE,
      });
    }

    return risks;
  }

  private getResourceImpact(resourceType: ResourceType): ImpactLevel {
    const impactMap: Record<ResourceType, ImpactLevel> = {
      [ResourceType.COMPUTE]: ImpactLevel.HIGH,
      [ResourceType.STORAGE]: ImpactLevel.MEDIUM,
      [ResourceType.NETWORK]: ImpactLevel.CRITICAL,
      [ResourceType.DATABASE]: ImpactLevel.CRITICAL,
      [ResourceType.SECURITY_GROUP]: ImpactLevel.HIGH,
      [ResourceType.COMPUTE_ENGINE]: ImpactLevel.HIGH,
      [ResourceType.CLOUD_STORAGE]: ImpactLevel.MEDIUM,
      [ResourceType.VPC_NETWORK]: ImpactLevel.CRITICAL,
      [ResourceType.CLOUD_SQL]: ImpactLevel.CRITICAL,
      [ResourceType.LOAD_BALANCER]: ImpactLevel.HIGH,
      [ResourceType.FIREWALL_RULE]: ImpactLevel.HIGH,
      [ResourceType.IAM_ROLE]: ImpactLevel.MEDIUM,
      [ResourceType.CLOUD_DNS]: ImpactLevel.MEDIUM,
      [ResourceType.SSL_CERTIFICATE]: ImpactLevel.LOW,
      [ResourceType.CONTAINER_REGISTRY]: ImpactLevel.LOW,
      [ResourceType.GKE_CLUSTER]: ImpactLevel.CRITICAL,
      [ResourceType.CLOUD_FUNCTION]: ImpactLevel.MEDIUM,
    };

    return impactMap[resourceType] || ImpactLevel.MEDIUM;
  }

  private generateMitigationStrategies(riskFactors: RiskFactor[]): string[] {
    const strategies: string[] = [];

    if (riskFactors.some((f) => f.type === RiskType.DOWNTIME)) {
      strategies.push('Schedule changes during maintenance window');
      strategies.push('Implement blue-green deployment strategy');
      strategies.push('Prepare rollback procedures');
    }

    if (riskFactors.some((f) => f.type === RiskType.DATA_LOSS)) {
      strategies.push('Create backup before making changes');
      strategies.push('Test changes in non-production environment first');
      strategies.push('Implement point-in-time recovery');
    }

    if (riskFactors.some((f) => f.type === RiskType.SECURITY)) {
      strategies.push('Review security group rules carefully');
      strategies.push('Test access controls after changes');
      strategies.push('Monitor for unauthorized access');
    }

    return strategies;
  }
}

class CostEstimator {
  async estimateCost(changes: InfrastructureChange[]): Promise<CostEstimate> {
    const breakdown: CostBreakdown[] = [];
    let totalMonthlyCost = 0;

    for (const change of changes) {
      const changeCost = this.estimateChangeCost(change);
      if (changeCost > 0) {
        breakdown.push({
          resourceType: change.resourceType,
          resourceName: change.resourceName,
          monthlyCost: changeCost,
          yearlyCost: changeCost * 12,
        });
        totalMonthlyCost += changeCost;
      }
    }

    return {
      currency: 'USD',
      monthly: totalMonthlyCost,
      yearly: totalMonthlyCost * 12,
      breakdown,
    };
  }

  private estimateChangeCost(change: InfrastructureChange): number {
    // Simple cost estimation - in production, this would integrate with GCP pricing APIs
    const baseCosts: Record<ResourceType, number> = {
      [ResourceType.COMPUTE]: 50,
      [ResourceType.STORAGE]: 10,
      [ResourceType.NETWORK]: 0,
      [ResourceType.DATABASE]: 100,
      [ResourceType.SECURITY_GROUP]: 0,
      [ResourceType.COMPUTE_ENGINE]: 50,
      [ResourceType.CLOUD_STORAGE]: 10,
      [ResourceType.VPC_NETWORK]: 0,
      [ResourceType.CLOUD_SQL]: 100,
      [ResourceType.LOAD_BALANCER]: 25,
      [ResourceType.FIREWALL_RULE]: 0,
      [ResourceType.IAM_ROLE]: 0,
      [ResourceType.CLOUD_DNS]: 1,
      [ResourceType.SSL_CERTIFICATE]: 0,
      [ResourceType.CONTAINER_REGISTRY]: 5,
      [ResourceType.GKE_CLUSTER]: 75,
      [ResourceType.CLOUD_FUNCTION]: 5,
    };

    const baseCost = baseCosts[change.resourceType] || 0;

    switch (change.action) {
      case ChangeAction.CREATE:
        return baseCost;
      case ChangeAction.DELETE:
        return -baseCost;
      case ChangeAction.REPLACE:
        return 0; // No net cost change
      case ChangeAction.UPDATE:
        return baseCost * 0.1; // Small cost for updates
      default:
        return 0;
    }
  }
}

class TimelineCalculator {
  async calculateTimeline(changes: InfrastructureChange[]): Promise<ExecutionTimeline> {
    const phases = this.createExecutionPhases(changes);
    const dependencies = this.calculateDependencies(phases);
    const totalDuration = this.calculateTotalDuration(phases, dependencies);

    return {
      estimatedDuration: totalDuration,
      phases,
      dependencies,
    };
  }

  private createExecutionPhases(changes: InfrastructureChange[]): ExecutionPhase[] {
    const phases: ExecutionPhase[] = [];

    // Group changes by action type
    const deleteChanges = changes.filter((c) => c.action === ChangeAction.DELETE);
    const replaceChanges = changes.filter((c) => c.action === ChangeAction.REPLACE);
    const createChanges = changes.filter((c) => c.action === ChangeAction.CREATE);
    const updateChanges = changes.filter((c) => c.action === ChangeAction.UPDATE);

    if (deleteChanges.length > 0) {
      phases.push({
        name: 'Delete Resources',
        duration: this.estimatePhaseDuration(deleteChanges),
        resources: deleteChanges.map((c) => c.resourceName),
        parallelizable: true,
      });
    }

    if (replaceChanges.length > 0) {
      phases.push({
        name: 'Replace Resources',
        duration: this.estimatePhaseDuration(replaceChanges),
        resources: replaceChanges.map((c) => c.resourceName),
        parallelizable: false,
      });
    }

    if (createChanges.length > 0) {
      phases.push({
        name: 'Create Resources',
        duration: this.estimatePhaseDuration(createChanges),
        resources: createChanges.map((c) => c.resourceName),
        parallelizable: true,
      });
    }

    if (updateChanges.length > 0) {
      phases.push({
        name: 'Update Resources',
        duration: this.estimatePhaseDuration(updateChanges),
        resources: updateChanges.map((c) => c.resourceName),
        parallelizable: true,
      });
    }

    return phases;
  }

  private calculateDependencies(phases: ExecutionPhase[]): PhaseDependency[] {
    const dependencies: PhaseDependency[] = [];

    // Create dependencies based on phase order
    for (let i = 1; i < phases.length; i++) {
      dependencies.push({
        phase: phases[i].name,
        dependsOn: [phases[i - 1].name],
        type: DependencyType.HARD,
      });
    }

    return dependencies;
  }

  private calculateTotalDuration(
    phases: ExecutionPhase[],
    _dependencies: PhaseDependency[]
  ): number {
    // Simple sequential calculation - in production, would consider parallelization
    return phases.reduce((total, phase) => total + phase.duration, 0);
  }

  private estimatePhaseDuration(changes: InfrastructureChange[]): number {
    // Estimate duration based on GCP resource types and actions
    const baseDurations: Record<ResourceType, number> = {
      [ResourceType.COMPUTE]: 300, // 5 minutes
      [ResourceType.STORAGE]: 60, // 1 minute
      [ResourceType.NETWORK]: 120, // 2 minutes
      [ResourceType.DATABASE]: 900, // 15 minutes
      [ResourceType.SECURITY_GROUP]: 30, // 30 seconds
      [ResourceType.COMPUTE_ENGINE]: 300, // 5 minutes
      [ResourceType.CLOUD_STORAGE]: 60, // 1 minute
      [ResourceType.VPC_NETWORK]: 120, // 2 minutes
      [ResourceType.CLOUD_SQL]: 900, // 15 minutes
      [ResourceType.LOAD_BALANCER]: 240, // 4 minutes
      [ResourceType.FIREWALL_RULE]: 30, // 30 seconds
      [ResourceType.IAM_ROLE]: 30, // 30 seconds
      [ResourceType.CLOUD_DNS]: 60, // 1 minute
      [ResourceType.SSL_CERTIFICATE]: 300, // 5 minutes
      [ResourceType.CONTAINER_REGISTRY]: 60, // 1 minute
      [ResourceType.GKE_CLUSTER]: 600, // 10 minutes
      [ResourceType.CLOUD_FUNCTION]: 120, // 2 minutes
    };

    let totalDuration = 0;
    for (const change of changes) {
      const baseDuration = baseDurations[change.resourceType] || 120;

      // Adjust duration based on action
      let actionMultiplier = 1;
      switch (change.action) {
        case ChangeAction.CREATE:
          actionMultiplier = 1;
          break;
        case ChangeAction.UPDATE:
          actionMultiplier = 0.5;
          break;
        case ChangeAction.DELETE:
          actionMultiplier = 0.3;
          break;
        case ChangeAction.REPLACE:
          actionMultiplier = 1.5;
          break;
      }

      totalDuration += baseDuration * actionMultiplier;
    }

    return Math.ceil(totalDuration);
  }
}
