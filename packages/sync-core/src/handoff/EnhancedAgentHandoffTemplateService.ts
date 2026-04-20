/**
 * Enhanced Agent Handoff Template Service
 * 
 * Extends the existing AgentHandoffTemplateService with flywheel protocol integration,
 * versioning, analytics, and real-time synchronization capabilities.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { PromptHandoffFlywheel, HandoffTemplate, HandoffContext } from './PromptHandoffFlywheel.js';
import { SyncOrchestrator } from '../services/SyncOrchestrator.js';
import { MasterClockService } from '../services/MasterClockService.js';

// Import existing services (assuming they exist in the codebase)
interface ExistingPromptTemplateService {
  createTemplate(template: any): Promise<any>;
  getTemplate(id: string): Promise<any>;
  updateTemplate(id: string, updates: any): Promise<any>;
  compileTemplate(id: string, versionId?: string, variables?: Record<string, any>): Promise<string>;
  executeTemplate(id: string, versionId?: string, variables?: Record<string, any>): Promise<any>;
  getTemplateAnalytics(id: string): Promise<any>;
  recordExecution(result: any): Promise<void>;
}

interface ExistingAgentHandoffTemplateService {
  createHandoffPrompt(templateId: string, variables: Record<string, any>): Promise<string>;
  generateSessionMetrics(sessionData: any): Record<string, any>;
}

export interface EnhancedHandoffTemplate extends HandoffTemplate {
  // Additional fields for integration with existing template system
  baseTemplateId?: string; // Reference to existing PromptTemplate
  versionHistory: TemplateVersion[];
  analytics: TemplateAnalytics;
  integrationMetadata: {
    syncEnabled: boolean;
    lastSyncAt?: Date;
    conflictResolution: 'latest' | 'merge' | 'manual';
  };
}

export interface TemplateVersion {
  id: string;
  version: string;
  changes: string[];
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
  metrics: {
    usageCount: number;
    successRate: number;
    averageExecutionTime: number;
  };
}

export interface TemplateAnalytics {
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  contextPreservationRate: number;
  agentUtilization: Record<string, number>;
  popularVariables: string[];
  recentActivity: Date[];
  performanceTrends: {
    date: Date;
    executionCount: number;
    successRate: number;
    averageTime: number;
  }[];
}

export interface HandoffSession {
  id: string;
  agentId: string;
  templateId: string;
  startTime: Date;
  endTime?: Date;
  contexts: HandoffContext[];
  metrics: {
    totalHandoffs: number;
    successfulHandoffs: number;
    averageHandoffTime: number;
    contextPreservationScore: number;
    tokenEfficiency: number;
  };
  status: 'active' | 'completed' | 'failed' | 'cancelled';
}

export class EnhancedAgentHandoffTemplateService {
  private handoffTemplates = new Map<string, EnhancedHandoffTemplate>();
  private activeSessions = new Map<string, HandoffSession>();
  private templateVersions = new Map<string, TemplateVersion[]>();
  private logger?: { log: (message: string) => void };

  constructor(
    private flywheel: PromptHandoffFlywheel,
    private syncOrchestrator: SyncOrchestrator,
    private masterClock: MasterClockService,
    private existingTemplateService?: ExistingPromptTemplateService,
    private existingHandoffService?: ExistingAgentHandoffTemplateService
  ) {
    this.setupSyncHandlers();
    this.initializeDefaultTemplates();
  }

  /**
   * Requirement 4.1: Complete execution context and history preservation
   */
  async createEnhancedHandoffTemplate(
    template: Omit<EnhancedHandoffTemplate, 'id' | 'createdAt' | 'updatedAt' | 'versionHistory' | 'analytics'>
  ): Promise<string> {
    const templateId = this.generateId();
    const now = await this.masterClock.now();

    const enhancedTemplate: EnhancedHandoffTemplate = {
      ...template,
      id: templateId,
      createdAt: now,
      updatedAt: now,
      versionHistory: [{
        id: this.generateId(),
        version: template.version,
        changes: ['Initial template creation'],
        createdBy: 'system',
        createdAt: now,
        isActive: true,
        metrics: {
          usageCount: 0,
          successRate: 0,
          averageExecutionTime: 0
        }
      }],
      analytics: {
        totalExecutions: 0,
        successRate: 0,
        averageExecutionTime: 0,
        contextPreservationRate: 0,
        agentUtilization: {},
        popularVariables: [],
        recentActivity: [],
        performanceTrends: []
      }
    };

    this.handoffTemplates.set(templateId, enhancedTemplate);

    // Create corresponding template in existing system if available
    if (this.existingTemplateService) {
      const baseTemplate = await this.existingTemplateService.createTemplate({
        name: template.name,
        description: template.description,
        content: template.content,
        variables: template.variables,
        category: 'Handoff',
        tags: ['handoff', 'agent-communication', ...template.agentCapabilities]
      });
      
      enhancedTemplate.baseTemplateId = baseTemplate.id;
    }

    // Sync across all instances
    await this.syncOrchestrator.syncGlobalData('enhanced_handoff_template', {
      action: 'create',
      template: enhancedTemplate
    });

    return templateId;
  }

  /**
   * Requirement 4.2: Latest template versions with automatic updates
   */
  async updateHandoffTemplate(
    templateId: string,
    updates: Partial<EnhancedHandoffTemplate>,
    changes: string[] = []
  ): Promise<void> {
    const template = this.handoffTemplates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const now = await this.masterClock.now();
    const newVersion = this.incrementVersion(template.version);

    // Create new version record
    const versionRecord: TemplateVersion = {
      id: this.generateId(),
      version: newVersion,
      changes: changes.length > 0 ? changes : ['Template updated'],
      createdBy: 'system', // Could be enhanced to track actual user
      createdAt: now,
      isActive: true,
      metrics: {
        usageCount: 0,
        successRate: 0,
        averageExecutionTime: 0
      }
    };

    // Deactivate previous version
    template.versionHistory.forEach(v => v.isActive = false);
    template.versionHistory.push(versionRecord);

    // Update template
    const updatedTemplate: EnhancedHandoffTemplate = {
      ...template,
      ...updates,
      version: newVersion,
      updatedAt: now
    };

    this.handoffTemplates.set(templateId, updatedTemplate);

    // Update in existing template service if available
    if (this.existingTemplateService && template.baseTemplateId) {
      await this.existingTemplateService.updateTemplate(template.baseTemplateId, {
        content: updatedTemplate.content,
        variables: updatedTemplate.variables,
        updatedAt: now
      });
    }

    // Update flywheel template
    await this.flywheel.updateHandoffTemplate(templateId, {
      name: updatedTemplate.name,
      description: updatedTemplate.description,
      version: newVersion,
      content: updatedTemplate.content,
      variables: updatedTemplate.variables,
      contextRequirements: updatedTemplate.contextRequirements,
      agentCapabilities: updatedTemplate.agentCapabilities,
      successCriteria: updatedTemplate.successCriteria,
      backpressureThreshold: updatedTemplate.backpressureThreshold,
      loadBalancingWeight: updatedTemplate.loadBalancingWeight,
      updatedAt: now
    });

    // Sync update across all instances
    await this.syncOrchestrator.syncGlobalData('enhanced_handoff_template', {
      action: 'update',
      template: updatedTemplate,
      versionRecord
    });
  }

  /**
   * Requirement 4.3: Context preservation using existing agent memory systems
   */
  async initiateHandoffSession(
    agentId: string,
    templateId: string,
    sessionData: Record<string, any>,
    options: {
      preserveContext?: boolean;
      memoryIntegration?: boolean;
      targetAgentId?: string;
    } = {}
  ): Promise<string> {
    const sessionId = this.generateId();
    const now = await this.masterClock.now();

    const template = this.handoffTemplates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Create session
    const session: HandoffSession = {
      id: sessionId,
      agentId,
      templateId,
      startTime: now,
      contexts: [],
      metrics: {
        totalHandoffs: 0,
        successfulHandoffs: 0,
        averageHandoffTime: 0,
        contextPreservationScore: 0,
        tokenEfficiency: 0
      },
      status: 'active'
    };

    this.activeSessions.set(sessionId, session);

    // Prepare variables with context preservation
    const enhancedVariables = {
      ...template.variables,
      ...sessionData,
      session_id: sessionId,
      agent_id: agentId,
      timestamp: now.toISOString()
    };

    // Add memory context if enabled
    if (options.memoryIntegration) {
      enhancedVariables.agent_memory = await this.getAgentMemoryContext(agentId);
    }

    // Initiate handoff via flywheel
    const contextId = await this.flywheel.initiateHandoff(
      agentId,
      templateId,
      enhancedVariables,
      {
        targetAgentId: options.targetAgentId,
        sessionId,
        priority: 'normal',
        timeout: 300000
      }
    );

    // Track context in session
    const context = await this.flywheel.getHandoffContext(contextId);
    if (context) {
      session.contexts.push(context);
      session.metrics.totalHandoffs++;
    }

    // Sync session creation
    await this.syncOrchestrator.syncGlobalData('handoff_session', {
      action: 'create',
      session
    });

    return sessionId;
  }

  /**
   * Requirement 4.4: Backpressure and load balancing using existing agent orchestration
   */
  async getOptimalHandoffTarget(
    templateId: string,
    currentLoad: Record<string, number>,
    agentCapabilities: Record<string, string[]>
  ): Promise<string | null> {
    const template = this.handoffTemplates.get(templateId);
    if (!template) {
      return null;
    }

    // Find agents with required capabilities
    const capableAgents = Object.entries(agentCapabilities)
      .filter(([agentId, caps]) => 
        template.agentCapabilities.every(reqCap => caps.includes(reqCap))
      )
      .map(([agentId]) => agentId);

    if (capableAgents.length === 0) {
      return null;
    }

    // Apply load balancing
    const agentLoads = capableAgents.map(agentId => ({
      agentId,
      load: currentLoad[agentId] || 0,
      weight: template.loadBalancingWeight
    }));

    // Sort by weighted load (lower is better)
    agentLoads.sort((a, b) => (a.load * a.weight) - (b.load * b.weight));

    // Check backpressure threshold
    const selectedAgent = agentLoads[0];
    if (selectedAgent.load > template.backpressureThreshold) {
      // Apply backpressure - return null to trigger queuing
      return null;
    }

    return selectedAgent.agentId;
  }

  /**
   * Requirement 4.5: Unified analytics and metrics
   */
  async getTemplateAnalytics(templateId: string): Promise<TemplateAnalytics | null> {
    const template = this.handoffTemplates.get(templateId);
    if (!template) {
      return null;
    }

    // Update analytics with recent data
    await this.updateTemplateAnalytics(template);

    return template.analytics;
  }

  async getSessionMetrics(sessionId: string): Promise<HandoffSession['metrics'] | null> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Update session metrics
    await this.updateSessionMetrics(session);

    return session.metrics;
  }

  async generateHandoffReport(
    templateId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<{
    template: EnhancedHandoffTemplate;
    analytics: TemplateAnalytics;
    sessions: HandoffSession[];
    recommendations: string[];
  }> {
    const template = this.handoffTemplates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Get sessions in time range
    const sessions = Array.from(this.activeSessions.values())
      .filter(s => 
        s.templateId === templateId &&
        s.startTime >= timeRange.start &&
        s.startTime <= timeRange.end
      );

    // Generate recommendations
    const recommendations = await this.generateRecommendations(template, sessions);

    return {
      template,
      analytics: template.analytics,
      sessions,
      recommendations
    };
  }

  /**
   * Integration with existing services
   */
  async syncWithExistingTemplateService(): Promise<void> {
    if (!this.existingTemplateService) {
      return;
    }

    for (const template of this.handoffTemplates.values()) {
      if (template.baseTemplateId) {
        // Get latest analytics from existing service
        const existingAnalytics = await this.existingTemplateService
          .getTemplateAnalytics(template.baseTemplateId);

        if (existingAnalytics) {
          // Merge analytics
          template.analytics.totalExecutions += existingAnalytics.totalRuns || 0;
          template.analytics.successRate = 
            (template.analytics.successRate + existingAnalytics.successRate) / 2;
        }
      }
    }
  }

  async createHandoffPromptWithFlywheel(
    templateId: string,
    variables: Record<string, any>,
    options: {
      useExistingService?: boolean;
      enhanceWithContext?: boolean;
    } = {}
  ): Promise<string> {
    const template = this.handoffTemplates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Use existing service if requested and available
    if (options.useExistingService && this.existingHandoffService) {
      const existingPrompt = await this.existingHandoffService
        .createHandoffPrompt(templateId, variables);
      
      if (options.enhanceWithContext) {
        // Enhance with flywheel context
        return this.enhancePromptWithContext(existingPrompt, variables);
      }
      
      return existingPrompt;
    }

    // Use flywheel compilation
    return this.compileHandoffTemplate(template, variables);
  }

  /**
   * Private helper methods
   */
  private async setupSyncHandlers(): void {
    // Note: In a real implementation, this would set up Redis pub/sub listeners
    // or WebSocket handlers for remote updates. For now, we'll handle sync
    // through direct method calls when sync operations occur.
    this.logger?.log('Sync handlers initialized for handoff template service');
  }

  private async handleRemoteTemplateUpdate(data: any): Promise<void> {
    switch (data.action) {
      case 'create':
        this.handoffTemplates.set(data.template.id, data.template);
        break;
      case 'update':
        const existing = this.handoffTemplates.get(data.template.id);
        if (existing) {
          this.handoffTemplates.set(data.template.id, data.template);
        }
        break;
    }
  }

  private async handleRemoteSessionUpdate(data: any): Promise<void> {
    switch (data.action) {
      case 'create':
        this.activeSessions.set(data.session.id, data.session);
        break;
      case 'update':
        const existing = this.activeSessions.get(data.session.id);
        if (existing) {
          this.activeSessions.set(data.session.id, data.session);
        }
        break;
    }
  }

  private async getAgentMemoryContext(agentId: string): Promise<Record<string, any>> {
    // Integration with existing agent memory systems
    // This would connect to the actual agent memory service
    return {
      recent_interactions: [],
      context_summary: '',
      preferences: {},
      capabilities: []
    };
  }

  private async updateTemplateAnalytics(template: EnhancedHandoffTemplate): Promise<void> {
    // Update analytics based on recent executions
    const recentExecutions = template.analytics.recentActivity.length;
    
    if (recentExecutions > 0) {
      // Calculate trends
      const now = await this.masterClock.now();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const recentTrend = {
        date: now,
        executionCount: recentExecutions,
        successRate: template.analytics.successRate,
        averageTime: template.analytics.averageExecutionTime
      };

      template.analytics.performanceTrends.push(recentTrend);
      
      // Keep only last 30 days of trends
      template.analytics.performanceTrends = template.analytics.performanceTrends
        .filter(trend => trend.date > dayAgo)
        .slice(-30);
    }
  }

  private async updateSessionMetrics(session: HandoffSession): Promise<void> {
    if (session.contexts.length === 0) {
      return;
    }

    const completedContexts = session.contexts.filter(c => c.status === 'completed');
    const totalTime = completedContexts.reduce((sum, c) => {
      if (c.executionHistory.length > 0) {
        const lastExecution = c.executionHistory[c.executionHistory.length - 1];
        return sum + lastExecution.metrics.processingTime;
      }
      return sum;
    }, 0);

    session.metrics.successfulHandoffs = completedContexts.length;
    session.metrics.averageHandoffTime = totalTime / Math.max(completedContexts.length, 1);
    
    // Calculate context preservation score
    const preservationScores = completedContexts.flatMap(c => 
      c.executionHistory.map(e => e.contextPreservation)
    );
    
    session.metrics.contextPreservationScore = 
      preservationScores.reduce((sum, score) => sum + score, 0) / 
      Math.max(preservationScores.length, 1);

    // Calculate token efficiency (simplified)
    session.metrics.tokenEfficiency = Math.min(100, 
      (session.metrics.successfulHandoffs / session.metrics.totalHandoffs) * 100
    );
  }

  private async generateRecommendations(
    template: EnhancedHandoffTemplate,
    sessions: HandoffSession[]
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Analyze success rate
    if (template.analytics.successRate < 80) {
      recommendations.push('Consider reviewing template content for clarity and completeness');
    }

    // Analyze context preservation
    if (template.analytics.contextPreservationRate < 70) {
      recommendations.push('Enhance context requirements to improve preservation');
    }

    // Analyze execution time
    if (template.analytics.averageExecutionTime > 30000) {
      recommendations.push('Consider optimizing template for faster execution');
    }

    // Analyze agent utilization
    const utilizationValues = Object.values(template.analytics.agentUtilization);
    const maxUtilization = Math.max(...utilizationValues);
    const minUtilization = Math.min(...utilizationValues);
    
    if (maxUtilization - minUtilization > 50) {
      recommendations.push('Consider load balancing improvements for better agent distribution');
    }

    return recommendations;
  }

  private compileHandoffTemplate(
    template: EnhancedHandoffTemplate,
    variables: Record<string, any>
  ): string {
    let compiled = template.content;

    // Replace variables
    Object.entries({ ...template.variables, ...variables }).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      compiled = compiled.replace(regex, String(value));
    });

    return compiled;
  }

  private enhancePromptWithContext(
    prompt: string,
    variables: Record<string, any>
  ): string {
    const contextSection = `\n\n## Enhanced Context\n${JSON.stringify(variables, null, 2)}`;
    return prompt + contextSection;
  }

  private initializeDefaultTemplates(): void {
    // Initialize with enhanced versions of existing templates
    // This would be populated from the existing AgentHandoffTemplateService
  }

  private generateId(): string {
    return `enhanced_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  /**
   * Public API methods
   */
  async getTemplate(templateId: string): Promise<EnhancedHandoffTemplate | null> {
    return this.handoffTemplates.get(templateId) || null;
  }

  async listTemplates(): Promise<EnhancedHandoffTemplate[]> {
    return Array.from(this.handoffTemplates.values());
  }

  async getSession(sessionId: string): Promise<HandoffSession | null> {
    return this.activeSessions.get(sessionId) || null;
  }

  async listActiveSessions(): Promise<HandoffSession[]> {
    return Array.from(this.activeSessions.values())
      .filter(s => s.status === 'active');
  }

  async completeSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'completed';
      session.endTime = await this.masterClock.now();
      
      await this.syncOrchestrator.syncGlobalData('handoff_session', {
        action: 'complete',
        session
      });
    }
  }
}