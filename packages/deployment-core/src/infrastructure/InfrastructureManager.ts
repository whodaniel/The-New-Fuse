/**
 * Infrastructure Manager Implementation
 * Core implementation for infrastructure management operations
 */

import { MetricsCollector } from '../core/MetricsCollector';
import {
  IInfrastructureManager,
  InfrastructureFilters,
  InfrastructureImportConfig,
  InfrastructureMetrics,
} from '../interfaces/IInfrastructureManager';
import {
  ApplyResult,
  DestroyResult,
  ExecutionPlan,
  InfrastructureChange,
  InfrastructureState,
  InfrastructureStatus,
  InfrastructureTemplate,
  InfrastructureUpdate,
  PlanResult,
  ProvisionResult,
  ResourceState,
  UpdateResult,
  ValidationResult,
} from '../types/infrastructure';
import { ChangeAnalyzer } from './ChangeAnalyzer';
import { ResourceProvisioner } from './ResourceProvisioner';
import { StateManager } from './StateManager';
import { TemplateParser } from './TemplateParser';
import { TemplateValidator } from './TemplateValidator';

export class InfrastructureManager implements IInfrastructureManager {
  private templateParser: TemplateParser;
  private stateManager: StateManager;
  private resourceProvisioner: ResourceProvisioner;
  private templateValidator: TemplateValidator;
  private changeAnalyzer: ChangeAnalyzer;
  private metricsCollector: MetricsCollector;

  constructor(
    templateParser: TemplateParser,
    stateManager: StateManager,
    resourceProvisioner: ResourceProvisioner,
    templateValidator: TemplateValidator,
    changeAnalyzer: ChangeAnalyzer,
    metricsCollector: MetricsCollector
  ) {
    this.templateParser = templateParser;
    this.stateManager = stateManager;
    this.resourceProvisioner = resourceProvisioner;
    this.templateValidator = templateValidator;
    this.changeAnalyzer = changeAnalyzer;
    this.metricsCollector = metricsCollector;
  }

  async provisionInfrastructure(template: InfrastructureTemplate): Promise<ProvisionResult> {
    const startTime = Date.now();

    try {
      // Validate template
      const validation = await this.validateTemplate(template);
      if (!validation.valid) {
        return {
          success: false,
          infrastructureId: '',
          resources: [],
          duration: Date.now() - startTime,
          error: `Template validation failed: ${validation.errors.map((e) => e.message).join(', ')}`,
          warnings: validation.warnings.map((w) => w.message),
        };
      }

      // Parse template
      const parsedTemplate = await this.templateParser.parse(template);

      // Create infrastructure state
      const infrastructureState: InfrastructureState = {
        id: this.generateId(),
        templateId: template.id,
        environment: this.extractEnvironment(template),
        resources: [],
        status: InfrastructureStatus.PROVISIONING,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          version: template.version,
          checksum: this.calculateChecksum(template),
          locked: false,
        },
      };

      // Save initial state
      await this.stateManager.saveState(infrastructureState);

      // Provision resources
      const provisionResults = await this.resourceProvisioner.provisionResources(
        parsedTemplate.resources,
        infrastructureState.id
      );

      // Update state with provisioned resources
      infrastructureState.resources = provisionResults.map((result) => ({
        id: result.resourceId || '',
        name: result.resourceName,
        type: result.resourceType,
        state: result.success ? ResourceState.CREATED : ResourceState.ERROR,
        properties: {},
        outputs: result.outputs || {},
        lastModified: new Date(),
        error: result.error,
      }));

      infrastructureState.status = provisionResults.every((r) => r.success)
        ? InfrastructureStatus.PROVISIONED
        : InfrastructureStatus.ERROR;
      infrastructureState.updatedAt = new Date();

      // Save final state
      await this.stateManager.saveState(infrastructureState);

      // Collect metrics
      await this.metricsCollector.recordProvisioningMetrics({
        infrastructureId: infrastructureState.id,
        duration: Date.now() - startTime,
        resourceCount: provisionResults.length,
        success: infrastructureState.status === InfrastructureStatus.PROVISIONED,
      });

      return {
        success: infrastructureState.status === InfrastructureStatus.PROVISIONED,
        infrastructureId: infrastructureState.id,
        resources: provisionResults,
        duration: Date.now() - startTime,
        warnings: validation.warnings.map((w) => w.message),
      };
    } catch (error) {
      return {
        success: false,
        infrastructureId: '',
        resources: [],
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        warnings: [],
      };
    }
  }

  async updateInfrastructure(update: InfrastructureUpdate): Promise<UpdateResult> {
    const startTime = Date.now();

    try {
      // Get current state
      const currentState = await this.stateManager.getState(update.infrastructureId);
      if (!currentState) {
        throw new Error(`Infrastructure ${update.infrastructureId} not found`);
      }

      // Lock infrastructure for update
      await this.lockInfrastructure(update.infrastructureId, 'Infrastructure update');

      try {
        // Analyze changes
        const changes = await this.changeAnalyzer.analyzeChanges(currentState, update);

        // Plan changes
        const plan = await this.planChanges(changes);

        // Apply changes
        const applyResult = await this.applyChanges({
          id: this.generateId(),
          templateId: update.infrastructureId, // Use infrastructure ID, not template ID
          environment: currentState.environment,
          changes: changes,
          estimatedDuration: plan.timeline.estimatedDuration,
          riskLevel: plan.riskAssessment.level,
          approvals: [],
          createdAt: new Date(),
        });

        return {
          success: applyResult.success,
          infrastructureId: update.infrastructureId,
          changesApplied: applyResult.changesApplied,
          duration: Date.now() - startTime,
          error: applyResult.error,
          warnings: applyResult.warnings,
        };
      } finally {
        // Always unlock infrastructure
        await this.unlockInfrastructure(update.infrastructureId);
      }
    } catch (error) {
      return {
        success: false,
        infrastructureId: update.infrastructureId,
        changesApplied: [],
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        warnings: [],
      };
    }
  }

  async destroyInfrastructure(resourceId: string): Promise<DestroyResult> {
    const startTime = Date.now();

    try {
      // Get current state
      const currentState = await this.stateManager.getState(resourceId);
      if (!currentState) {
        throw new Error(`Infrastructure ${resourceId} not found`);
      }

      // Lock infrastructure for destruction
      await this.lockInfrastructure(resourceId, 'Infrastructure destruction');

      try {
        // Update status to destroying
        currentState.status = InfrastructureStatus.DESTROYING;
        currentState.updatedAt = new Date();
        await this.stateManager.saveState(currentState);

        // Destroy resources in reverse dependency order
        const destroyResults = await this.resourceProvisioner.destroyResources(
          currentState.resources,
          resourceId
        );

        // Update final state
        currentState.status = InfrastructureStatus.DESTROYED;
        currentState.updatedAt = new Date();
        await this.stateManager.saveState(currentState);

        return {
          success: true,
          infrastructureId: resourceId,
          resourcesDestroyed: destroyResults.filter((r) => r.success).map((r) => r.resourceName),
          duration: Date.now() - startTime,
          warnings: destroyResults.filter((r) => !r.success).map((r) => r.error || 'Unknown error'),
        };
      } finally {
        // Unlock infrastructure
        await this.unlockInfrastructure(resourceId);
      }
    } catch (error) {
      return {
        success: false,
        infrastructureId: resourceId,
        resourcesDestroyed: [],
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        warnings: [],
      };
    }
  }

  async validateTemplate(template: InfrastructureTemplate): Promise<ValidationResult> {
    const result = await this.templateValidator.validate(template);

    // Convert TemplateValidator result to expected ValidationResult format
    return {
      valid: result.isValid,
      errors: result.errors.map((err) => ({
        code: err.rule,
        message: err.message,
        path: err.path,
        severity: err.severity,
      })),
      warnings: result.warnings.map((warn) => ({
        code: warn.rule,
        message: warn.message,
        path: warn.path,
        recommendation: warn.suggestion || '',
      })),
      suggestions: result.suggestions.map((sugg) => ({
        type: sugg.rule as any,
        message: sugg.message,
        path: sugg.path,
        improvement: sugg.suggestion || '',
      })),
    };
  }

  async planChanges(changes: InfrastructureChange[]): Promise<PlanResult> {
    return await this.changeAnalyzer.planChanges(changes);
  }

  async applyChanges(plan: ExecutionPlan): Promise<ApplyResult> {
    const startTime = Date.now();

    try {
      // Get current state - plan.templateId is actually the infrastructure ID in this context
      const currentState = await this.stateManager.getState(plan.templateId);
      if (!currentState) {
        throw new Error(`Infrastructure ${plan.templateId} not found`);
      }

      // Apply changes
      const appliedChanges: InfrastructureChange[] = [];

      for (const change of plan.changes) {
        try {
          await this.resourceProvisioner.applyChange(change, plan.templateId);
          appliedChanges.push(change);
        } catch (_error) {
          // Log error but continue with other changes
        }
      }

      // Update state
      currentState.status = InfrastructureStatus.PROVISIONED;
      currentState.updatedAt = new Date();
      await this.stateManager.saveState(currentState);

      return {
        success: appliedChanges.length === plan.changes.length,
        planId: plan.id,
        infrastructureId: plan.templateId,
        changesApplied: appliedChanges,
        duration: Date.now() - startTime,
        finalState: currentState,
        warnings:
          appliedChanges.length < plan.changes.length ? ['Some changes failed to apply'] : [],
      };
    } catch (error) {
      return {
        success: false,
        planId: plan.id,
        infrastructureId: plan.templateId,
        changesApplied: [],
        duration: Date.now() - startTime,
        finalState: (await this.stateManager.getState(plan.templateId)) || null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        warnings: [],
      };
    }
  }

  async getInfrastructureState(infrastructureId: string): Promise<InfrastructureState> {
    const state = await this.stateManager.getState(infrastructureId);
    if (!state) {
      throw new Error(`Infrastructure ${infrastructureId} not found`);
    }
    return state;
  }

  async listInfrastructure(filters?: InfrastructureFilters): Promise<InfrastructureState[]> {
    return await this.stateManager.listStates(filters);
  }

  async importInfrastructure(importConfig: InfrastructureImportConfig): Promise<ProvisionResult> {
    const startTime = Date.now();

    try {
      // Import existing resources
      const importedResources = await this.resourceProvisioner.importResources(importConfig);

      // Create infrastructure state
      const infrastructureState: InfrastructureState = {
        id: this.generateId(),
        templateId: importConfig.templateName,
        environment: importConfig.environment,
        resources: importedResources.map((resource) => ({
          id: resource.resourceId || '',
          name: resource.resourceName,
          type: resource.resourceType,
          state: ResourceState.CREATED,
          properties: {},
          outputs: resource.outputs || {},
          lastModified: new Date(),
        })),
        status: InfrastructureStatus.PROVISIONED,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          version: '1.0.0',
          checksum: this.calculateChecksum(importConfig),
          locked: false,
        },
      };

      // Save state
      await this.stateManager.saveState(infrastructureState);

      return {
        success: true,
        infrastructureId: infrastructureState.id,
        resources: importedResources,
        duration: Date.now() - startTime,
        warnings: [],
      };
    } catch (error) {
      return {
        success: false,
        infrastructureId: '',
        resources: [],
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        warnings: [],
      };
    }
  }

  async exportInfrastructure(infrastructureId: string): Promise<InfrastructureTemplate> {
    const state = await this.getInfrastructureState(infrastructureId);
    return await this.templateParser.generateTemplate(state);
  }

  async lockInfrastructure(infrastructureId: string, lockReason: string): Promise<void> {
    await this.stateManager.lockState(infrastructureId, lockReason);
  }

  async unlockInfrastructure(infrastructureId: string): Promise<void> {
    await this.stateManager.unlockState(infrastructureId);
  }

  async getInfrastructureMetrics(infrastructureId: string): Promise<InfrastructureMetrics> {
    return await this.metricsCollector.getInfrastructureMetrics(infrastructureId);
  }

  async refreshState(infrastructureId: string): Promise<InfrastructureState> {
    const currentState = await this.getInfrastructureState(infrastructureId);
    const refreshedState = await this.resourceProvisioner.refreshResourceStates(currentState);
    await this.stateManager.saveState(refreshedState);
    return refreshedState;
  }

  private generateId(): string {
    return `infra-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractEnvironment(template: InfrastructureTemplate): string {
    // Extract environment from template metadata or variables
    const envVar = template.variables.find((v) => v.name === 'environment');
    return envVar?.defaultValue || 'unknown';
  }

  private calculateChecksum(data: any): string {
    // Simple checksum calculation - in production, use a proper hash function
    return Buffer.from(JSON.stringify(data)).toString('base64').substr(0, 16);
  }
}
