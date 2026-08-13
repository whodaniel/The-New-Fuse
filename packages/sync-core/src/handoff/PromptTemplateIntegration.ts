/**
 * Prompt Template Integration Service
 *
 * Integrates the flywheel handoff system with existing PromptTemplateServiceImpl
 * for versioning, analytics, and template management.
 *
 * Requirements: 4.2, 4.5
 */

import { SyncOrchestrator } from '../services/SyncOrchestrator';
import {
  EnhancedAgentHandoffTemplateService,
  EnhancedHandoffTemplate,
} from './EnhancedAgentHandoffTemplateService';
import { PromptHandoffFlywheel } from './PromptHandoffFlywheel';

// Interface for existing PromptTemplateServiceImpl
interface PromptTemplateServiceImpl {
  createTemplate(template: any): Promise<any>;
  getTemplate(id: string): Promise<any>;
  updateTemplate(id: string, updates: any): Promise<any>;
  deleteTemplate(id: string): Promise<boolean>;
  listTemplates(filter?: any): Promise<any[]>;
  createVersion(templateId: string, version: any): Promise<any>;
  getVersion(versionId: string): Promise<any>;
  setActiveVersion(templateId: string, versionId: string): Promise<any>;
  listVersions(templateId: string): Promise<any[]>;
  compileTemplate(
    templateId: string,
    versionId?: string,
    variables?: Record<string, any>
  ): Promise<string>;
  executeTemplate(
    templateId: string,
    versionId?: string,
    variables?: Record<string, any>
  ): Promise<any>;
  getTemplateAnalytics(templateId: string): Promise<any>;
  recordExecution(result: any): Promise<void>;
}

export interface IntegratedTemplate {
  handoffTemplate: EnhancedHandoffTemplate;
  baseTemplate: any; // From PromptTemplateServiceImpl
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  lastSyncAt: Date;
  syncMetadata: {
    versionMapping: Record<string, string>; // handoff version -> base version
    conflictResolution: 'handoff_wins' | 'base_wins' | 'merge' | 'manual';
    autoSync: boolean;
  };
}

export interface TemplateExecutionResult {
  id: string;
  templateId: string;
  handoffContextId?: string;
  executionType: 'handoff' | 'direct' | 'integrated';
  startTime: Date;
  endTime: Date;
  success: boolean;
  result?: any;
  error?: string;
  metrics: {
    processingTime: number;
    tokenUsage?: number;
    contextPreservation?: number;
    handoffEfficiency?: number;
  };
  variables: Record<string, any>;
}

export class PromptTemplateIntegration {
  private integratedTemplates = new Map<string, IntegratedTemplate>();
  private executionResults: TemplateExecutionResult[] = [];

  constructor(
    private handoffService: EnhancedAgentHandoffTemplateService,
    private flywheel: PromptHandoffFlywheel,
    private syncOrchestrator: SyncOrchestrator,
    private promptTemplateService: PromptTemplateServiceImpl
  ) {
    this.setupSyncHandlers();
    this.startPeriodicSync();
  }

  /**
   * Requirement 4.2: Latest template versions with automatic updates
   */
  async integrateTemplate(
    handoffTemplateId: string,
    options: {
      createBaseTemplate?: boolean;
      autoSync?: boolean;
      conflictResolution?: 'handoff_wins' | 'base_wins' | 'merge' | 'manual';
    } = {}
  ): Promise<string> {
    const handoffTemplate = await this.handoffService.getTemplate(handoffTemplateId);
    if (!handoffTemplate) {
      throw new Error(`Handoff template not found: ${handoffTemplateId}`);
    }

    let baseTemplate;

    if (options.createBaseTemplate || !handoffTemplate.baseTemplateId) {
      // Create corresponding base template
      baseTemplate = await this.promptTemplateService.createTemplate({
        name: `${handoffTemplate.name} (Handoff)`,
        description: `${handoffTemplate.description} - Integrated with handoff system`,
        content: handoffTemplate.content,
        variables: handoffTemplate.variables,
        category: 'Handoff',
        tags: ['handoff', 'agent-communication', ...handoffTemplate.agentCapabilities],
        isPublic: false,
      });

      // Update handoff template with base reference
      handoffTemplate.baseTemplateId = baseTemplate.id;
    } else {
      baseTemplate = await this.promptTemplateService.getTemplate(handoffTemplate.baseTemplateId);
    }

    if (!baseTemplate) {
      throw new Error('Failed to create or find base template');
    }

    const integrated: IntegratedTemplate = {
      handoffTemplate,
      baseTemplate,
      syncStatus: 'synced',
      lastSyncAt: new Date(),
      syncMetadata: {
        versionMapping: {
          [handoffTemplate.version]: baseTemplate.currentVersion,
        },
        conflictResolution: options.conflictResolution || 'merge',
        autoSync: options.autoSync !== false,
      },
    };

    this.integratedTemplates.set(handoffTemplateId, integrated);

    // Sync integration across instances
    await this.syncOrchestrator.syncGlobalData('template_integration', {
      action: 'integrate',
      templateId: handoffTemplateId,
      integration: integrated,
    });

    return handoffTemplateId;
  }

  /**
   * Bidirectional synchronization between handoff and base templates
   */
  async syncTemplate(
    templateId: string,
    direction: 'handoff_to_base' | 'base_to_handoff' | 'bidirectional' = 'bidirectional'
  ): Promise<void> {
    const integrated = this.integratedTemplates.get(templateId);
    if (!integrated) {
      throw new Error(`Template not integrated: ${templateId}`);
    }

    try {
      if (direction === 'handoff_to_base' || direction === 'bidirectional') {
        await this.syncHandoffToBase(integrated);
      }

      if (direction === 'base_to_handoff' || direction === 'bidirectional') {
        await this.syncBaseToHandoff(integrated);
      }

      integrated.syncStatus = 'synced';
      integrated.lastSyncAt = new Date();
    } catch (error) {
      integrated.syncStatus = 'error';
      throw error;
    }
  }

  private async syncHandoffToBase(integrated: IntegratedTemplate): Promise<void> {
    const { handoffTemplate, baseTemplate } = integrated;

    // Check if handoff template is newer
    if (handoffTemplate.updatedAt > baseTemplate.updatedAt) {
      // Create new version in base template
      const newVersion = await this.promptTemplateService.createVersion(baseTemplate.id, {
        version: this.getNextVersionNumber(baseTemplate.versions),
        name: `Sync from handoff v${handoffTemplate.version}`,
        content: handoffTemplate.content,
        variables: handoffTemplate.variables,
        isActive: true,
        changelog: `Synchronized from handoff template at ${handoffTemplate.updatedAt.toISOString()}`,
      });

      // Update version mapping
      integrated.syncMetadata.versionMapping[handoffTemplate.version] = newVersion.id;

      // Set as active version
      await this.promptTemplateService.setActiveVersion(baseTemplate.id, newVersion.id);
    }
  }

  private async syncBaseToHandoff(integrated: IntegratedTemplate): Promise<void> {
    const { handoffTemplate, baseTemplate } = integrated;

    // Get latest base template
    const latestBase = await this.promptTemplateService.getTemplate(baseTemplate.id);

    if (latestBase.updatedAt > handoffTemplate.updatedAt) {
      // Update handoff template
      await this.handoffService.updateHandoffTemplate(
        handoffTemplate.id,
        {
          content: latestBase.content || handoffTemplate.content,
          variables: { ...handoffTemplate.variables, ...latestBase.variables },
          description: latestBase.description || handoffTemplate.description,
        },
        [`Synchronized from base template v${latestBase.currentVersion}`]
      );

      // Update version mapping
      const newHandoffVersion = this.incrementVersion(handoffTemplate.version);
      integrated.syncMetadata.versionMapping[newHandoffVersion] = latestBase.currentVersion;
    }
  }

  /**
   * Requirement 4.5: Unified analytics and metrics
   */
  async executeIntegratedTemplate(
    templateId: string,
    variables: Record<string, any>,
    options: {
      executionType?: 'handoff' | 'direct' | 'auto';
      targetAgentId?: string;
      useHandoffFlywheel?: boolean;
    } = {}
  ): Promise<TemplateExecutionResult> {
    const integrated = this.integratedTemplates.get(templateId);
    if (!integrated) {
      throw new Error(`Template not integrated: ${templateId}`);
    }

    const executionId = this.generateId();
    const startTime = new Date();
    let executionType = options.executionType || 'auto';

    // Auto-determine execution type
    if (executionType === 'auto') {
      executionType = options.targetAgentId || options.useHandoffFlywheel ? 'handoff' : 'direct';
    }

    try {
      let result;
      let handoffContextId;

      if (executionType === 'handoff') {
        // Execute via handoff flywheel
        const sessionId = await this.handoffService.initiateHandoffSession(
          'system', // Could be enhanced to track actual initiator
          templateId,
          variables,
          {
            targetAgentId: options.targetAgentId,
            preserveContext: true,
            memoryIntegration: true,
          }
        );

        const session = await this.handoffService.getSession(sessionId);
        if (session && session.contexts.length > 0) {
          handoffContextId = session.contexts[0].id;
          result = session.contexts[0].executionHistory[0]?.output;
        }
      } else {
        // Execute via base template service
        const baseResult = await this.promptTemplateService.executeTemplate(
          integrated.baseTemplate.id,
          undefined,
          variables
        );
        result = baseResult.result;
      }

      const endTime = new Date();
      const executionResult: TemplateExecutionResult = {
        id: executionId,
        templateId,
        handoffContextId,
        executionType: executionType as any,
        startTime,
        endTime,
        success: true,
        result,
        metrics: {
          processingTime: endTime.getTime() - startTime.getTime(),
          tokenUsage: result?.tokenUsage,
          contextPreservation: handoffContextId ? 95 : 0, // Simplified
          handoffEfficiency: executionType === 'handoff' ? 90 : 0,
        },
        variables,
      };

      this.executionResults.push(executionResult);

      // Record in both systems
      await this.recordIntegratedExecution(executionResult);

      return executionResult;
    } catch (error) {
      const endTime = new Date();
      const executionResult: TemplateExecutionResult = {
        id: executionId,
        templateId,
        handoffContextId,
        executionType: executionType as any,
        startTime,
        endTime,
        success: false,
        error: error.message,
        metrics: {
          processingTime: endTime.getTime() - startTime.getTime(),
        },
        variables,
      };

      this.executionResults.push(executionResult);
      throw error;
    }
  }

  async getIntegratedAnalytics(templateId: string): Promise<{
    handoffAnalytics: any;
    baseAnalytics: any;
    combinedMetrics: {
      totalExecutions: number;
      handoffExecutions: number;
      directExecutions: number;
      averageHandoffTime: number;
      averageDirectTime: number;
      handoffSuccessRate: number;
      directSuccessRate: number;
      contextPreservationRate: number;
    };
  }> {
    const integrated = this.integratedTemplates.get(templateId);
    if (!integrated) {
      throw new Error(`Template not integrated: ${templateId}`);
    }

    const handoffAnalytics = await this.handoffService.getTemplateAnalytics(templateId);
    const baseAnalytics = await this.promptTemplateService.getTemplateAnalytics(
      integrated.baseTemplate.id
    );

    // Calculate combined metrics
    const templateExecutions = this.executionResults.filter((e) => e.templateId === templateId);
    const handoffExecutions = templateExecutions.filter((e) => e.executionType === 'handoff');
    const directExecutions = templateExecutions.filter((e) => e.executionType === 'direct');

    const combinedMetrics = {
      totalExecutions: templateExecutions.length,
      handoffExecutions: handoffExecutions.length,
      directExecutions: directExecutions.length,
      averageHandoffTime: this.calculateAverageTime(handoffExecutions),
      averageDirectTime: this.calculateAverageTime(directExecutions),
      handoffSuccessRate: this.calculateSuccessRate(handoffExecutions),
      directSuccessRate: this.calculateSuccessRate(directExecutions),
      contextPreservationRate: this.calculateContextPreservation(handoffExecutions),
    };

    return {
      handoffAnalytics,
      baseAnalytics,
      combinedMetrics,
    };
  }

  /**
   * Conflict resolution
   */
  async resolveTemplateConflict(
    templateId: string,
    resolution: 'handoff_wins' | 'base_wins' | 'merge' | 'manual',
    manualResolution?: Partial<EnhancedHandoffTemplate>
  ): Promise<void> {
    const integrated = this.integratedTemplates.get(templateId);
    if (!integrated) {
      throw new Error(`Template not integrated: ${templateId}`);
    }

    switch (resolution) {
      case 'handoff_wins':
        await this.syncHandoffToBase(integrated);
        break;

      case 'base_wins':
        await this.syncBaseToHandoff(integrated);
        break;

      case 'merge':
        await this.mergeTemplates(integrated);
        break;

      case 'manual':
        if (manualResolution) {
          await this.applyManualResolution(integrated, manualResolution);
        }
        break;
    }

    integrated.syncStatus = 'synced';
    integrated.syncMetadata.conflictResolution = resolution;
  }

  private async mergeTemplates(integrated: IntegratedTemplate): Promise<void> {
    const { handoffTemplate, baseTemplate } = integrated;

    // Simple merge strategy - can be enhanced
    const mergedContent = this.mergeContent(handoffTemplate.content, baseTemplate.content);
    const mergedVariables = { ...baseTemplate.variables, ...handoffTemplate.variables };

    // Update both templates
    await this.handoffService.updateHandoffTemplate(
      handoffTemplate.id,
      {
        content: mergedContent,
        variables: mergedVariables,
      },
      ['Merged with base template']
    );

    const newVersion = await this.promptTemplateService.createVersion(baseTemplate.id, {
      version: this.getNextVersionNumber(baseTemplate.versions),
      name: 'Merged with handoff template',
      content: mergedContent,
      variables: mergedVariables,
      isActive: true,
      changelog: 'Merged with handoff template',
    });

    await this.promptTemplateService.setActiveVersion(baseTemplate.id, newVersion.id);
  }

  private async applyManualResolution(
    integrated: IntegratedTemplate,
    resolution: Partial<EnhancedHandoffTemplate>
  ): Promise<void> {
    await this.handoffService.updateHandoffTemplate(integrated.handoffTemplate.id, resolution, [
      'Manual conflict resolution applied',
    ]);
  }

  /**
   * Monitoring and maintenance
   */
  private setupSyncHandlers(): void {
    // Note: In a real implementation, this would set up Redis pub/sub listeners
    // or WebSocket handlers for remote updates. For now, we'll handle sync
    // through direct method calls when sync operations occur.
    console.log('Sync handlers initialized for template integration');
  }

  private startPeriodicSync(): void {
    // Sync every 5 minutes
    setInterval(
      async () => {
        for (const [templateId, integrated] of this.integratedTemplates.entries()) {
          if (integrated.syncMetadata.autoSync) {
            try {
              await this.syncTemplate(templateId);
            } catch (error) {
              console.error(`Failed to sync template ${templateId}:`, error);
            }
          }
        }
      },
      5 * 60 * 1000
    );
  }

  private async handleRemoteTemplateUpdate(templateId: string): Promise<void> {
    const integrated = this.integratedTemplates.get(templateId);
    if (integrated && integrated.syncMetadata.autoSync) {
      integrated.syncStatus = 'pending';
      await this.syncTemplate(templateId);
    }
  }

  private async recordIntegratedExecution(result: TemplateExecutionResult): Promise<void> {
    // Record in handoff system
    if (result.handoffContextId) {
      // Already recorded by flywheel
    }

    // Record in base template system
    const integrated = this.integratedTemplates.get(result.templateId);
    if (integrated) {
      await this.promptTemplateService.recordExecution({
        id: result.id,
        templateId: integrated.baseTemplate.id,
        versionId: integrated.baseTemplate.currentVersion,
        executedAt: result.endTime,
        success: result.success,
        responseTime: result.metrics.processingTime,
        tokenUsage: result.metrics.tokenUsage,
        result: result.result,
        error: result.error,
        variables: result.variables,
      });
    }
  }

  /**
   * Utility methods
   */
  private calculateAverageTime(executions: TemplateExecutionResult[]): number {
    if (executions.length === 0) return 0;
    const total = executions.reduce((sum, e) => sum + e.metrics.processingTime, 0);
    return total / executions.length;
  }

  private calculateSuccessRate(executions: TemplateExecutionResult[]): number {
    if (executions.length === 0) return 0;
    const successful = executions.filter((e) => e.success).length;
    return (successful / executions.length) * 100;
  }

  private calculateContextPreservation(executions: TemplateExecutionResult[]): number {
    const withContext = executions.filter((e) => e.metrics.contextPreservation !== undefined);
    if (withContext.length === 0) return 0;

    const total = withContext.reduce((sum, e) => sum + (e.metrics.contextPreservation || 0), 0);
    return total / withContext.length;
  }

  private mergeContent(handoffContent: string, baseContent: string): string {
    // Simple merge - in practice, this could use more sophisticated algorithms
    return `${handoffContent}\n\n<!-- Base Template Content -->\n${baseContent}`;
  }

  private getNextVersionNumber(versions: any[]): number {
    return Math.max(...versions.map((v) => v.version || 0)) + 1;
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  private generateId(): string {
    return `integrated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Public API
   */
  async getIntegratedTemplate(templateId: string): Promise<IntegratedTemplate | null> {
    return this.integratedTemplates.get(templateId) || null;
  }

  async listIntegratedTemplates(): Promise<IntegratedTemplate[]> {
    return Array.from(this.integratedTemplates.values());
  }

  async getExecutionHistory(templateId: string): Promise<TemplateExecutionResult[]> {
    return this.executionResults.filter((e) => e.templateId === templateId);
  }
}
