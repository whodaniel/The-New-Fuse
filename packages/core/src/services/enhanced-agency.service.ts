/**
 * Enhanced Agency Service - Integrates Agency Hub functionality with Swarm Orchestration
 * This service extends the existing agency.service.ts with swarm management capabilities
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AgentSwarmOrchestrationService } from './agent-swarm-orchestration.service';
import { ServiceCategoryRouterService } from './service-category-router.service';
import { 
  Agency, 
  AgencyTier, 
  ServiceRequest,
  ServiceCategory,
  ServiceProvider,
  SwarmExecution
} from '@prisma/client';

export interface EnhancedAgencyDto {
  name: string;
  subdomain: string;
  slug?: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
  tier?: AgencyTier;
  billingEmail?: string;
  template?: string;
  customDomain?: string;
  
  // Enhanced Agency Hub features
  enableSwarmOrchestration?: boolean;
  enableServiceRouting?: boolean;
  defaultServiceCategories?: string[];
  swarmConfiguration?: {
    maxConcurrentExecutions?: number;
    defaultQualityThreshold?: number;
    enableAutoScaling?: boolean;
  };
}

export interface AgencySwarmStatus {
  agencyId: string;
  isSwarmEnabled: boolean;
  activeExecutions: number;
  totalProviders: number;
  activeProviders: number;
  availableCategories: string[];
  recentActivity: {
    totalRequests: number;
    completedRequests: number;
    averageQualityScore: number;
    averageCompletionTime: number;
  };
}

export interface ServiceRequestOptions {
  categoryId: string;
  title: string;
  description: string;
  requirements: Record<string, any>;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  budget?: {
    min?: number;
    max?: number;
    currency: string;
  };
  timeline?: {
    startDate?: Date;
    deadline?: Date;
    flexibility?: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  };
  preferences?: {
    providerType?: 'ANY' | 'INDIVIDUAL' | 'TEAM' | 'SPECIALIST';
    communication?: 'MINIMAL' | 'REGULAR' | 'FREQUENT';
    reporting?: 'BASIC' | 'DETAILED' | 'COMPREHENSIVE';
  };
}

@Injectable()
export class EnhancedAgencyService {
  private readonly logger = new Logger(EnhancedAgencyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly swarmOrchestration: AgentSwarmOrchestrationService,
    private readonly serviceRouter: ServiceCategoryRouterService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  // =====================================================
  // AGENCY SWARM MANAGEMENT
  // =====================================================

  /**
   * Initialize swarm capabilities for an agency
   */
  async initializeAgencySwarm(
    agencyId: string,
    config?: {
      enabledCategories?: string[];
      qualityThreshold?: number;
      maxConcurrentExecutions?: number;
    }
  ): Promise<AgencySwarmStatus> {
    this.logger.log(`Initializing swarm capabilities for agency: ${agencyId}`);

    // Verify agency exists
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
      include: { agents: true }
    });

    if (!agency) {
      throw new Error(`Agency not found: ${agencyId}`);
    }

    // Initialize default service categories
    await this.serviceRouter.initializeAgencyCategories(
      agencyId,
      config?.enabledCategories
    );

    // Register existing agents as service providers
    await this.registerAgentsAsProviders(agencyId, agency.agents);

    // Update agency settings
    await this.prisma.agency.update({
      where: { id: agencyId },
      data: {
        settings: {
          ...agency.settings as any,
          swarmEnabled: true,
          swarmConfig: {
            qualityThreshold: config?.qualityThreshold || 0.8,
            maxConcurrentExecutions: config?.maxConcurrentExecutions || 10,
            enabledCategories: config?.enabledCategories || ['all']
          }
        }
      }
    });

    return this.getAgencySwarmStatus(agencyId);
  }

  /**
   * Get comprehensive swarm status for an agency
   */
  async getAgencySwarmStatus(agencyId: string): Promise<AgencySwarmStatus> {
    const [
      agency,
      activeExecutions,
      providers,
      categories,
      recentRequests
    ] = await Promise.all([
      this.prisma.agency.findUnique({ where: { id: agencyId } }),
      this.swarmOrchestration.getActiveSwarms(agencyId),
      this.serviceRouter.getAgencyProviders(agencyId),
      this.serviceRouter.getAvailableCategories(agencyId),
      this.getRecentServiceActivity(agencyId)
    ]);

    if (!agency) {
      throw new Error(`Agency not found: ${agencyId}`);
    }

    const settings = agency.settings as any;
    const activeProviders = providers.filter(p => p.isAvailable).length;

    return {
      agencyId,
      isSwarmEnabled: settings?.swarmEnabled || false,
      activeExecutions: activeExecutions.length,
      totalProviders: providers.length,
      activeProviders,
      availableCategories: categories.map(c => c.name),
      recentActivity: recentRequests
    };
  }

  // =====================================================
  // SERVICE REQUEST PROCESSING
  // =====================================================

  /**
   * Submit a service request through the agency swarm
   */
  async submitServiceRequest(
    agencyId: string,
    requesterId: string,
    options: ServiceRequestOptions
  ): Promise<{
    serviceRequest: ServiceRequest;
    swarmExecution?: SwarmExecution;
    estimatedCompletion?: Date;
  }> {
    this.logger.log(`Processing service request for agency: ${agencyId}`);

    // Validate agency and category
    const [agency, category] = await Promise.all([
      this.prisma.agency.findUnique({ where: { id: agencyId } }),
      this.prisma.serviceCategory.findUnique({ where: { id: options.categoryId } })
    ]);

    if (!agency) {
      throw new Error(`Agency not found: ${agencyId}`);
    }

    if (!category) {
      throw new Error(`Service category not found: ${options.categoryId}`);
    }

    // Create service request
    const serviceRequest = await this.prisma.serviceRequest.create({
      data: {
        agencyId,
        categoryId: options.categoryId,
        requesterId,
        title: options.title,
        description: options.description,
        requirements: options.requirements,
        priority: options.priority || 'MEDIUM',
        budget: options.budget,
        timeline: options.timeline,
        preferences: options.preferences,
        status: 'PENDING'
      }
    });

    // Route through service category router
    const routingResult = await this.serviceRouter.routeServiceRequest({
      id: serviceRequest.id,
      categoryId: options.categoryId,
      requirements: options.requirements,
      priority: options.priority || 'MEDIUM',
      timeline: options.timeline,
      budget: options.budget,
      requesterId,
      agencyId
    });

    let swarmExecution: SwarmExecution | undefined;
    let estimatedCompletion: Date | undefined;

    // If optimal providers found, initiate swarm execution
    if (routingResult.recommendedProviders.length > 0) {
      // Assign best provider
      const bestProvider = routingResult.recommendedProviders[0];
      await this.prisma.serviceRequest.update({
        where: { id: serviceRequest.id },
        data: { 
          providerId: bestProvider.id,
          status: 'ASSIGNED',
          assignedAt: new Date()
        }
      });

      // Start swarm execution
      try {
        swarmExecution = await this.swarmOrchestration.processServiceRequest({
          id: serviceRequest.id,
          categoryId: options.categoryId,
          requirements: options.requirements,
          priority: options.priority || 'MEDIUM',
          timeline: options.timeline,
          budget: options.budget,
          requesterId,
          agencyId
        });

        estimatedCompletion = this.calculateEstimatedCompletion(
          category,
          routingResult.estimatedDuration
        );

      } catch (error) {
        this.logger.error(`Failed to start swarm execution: ${error.message}`);
        
        // Update request status to failed
        await this.prisma.serviceRequest.update({
          where: { id: serviceRequest.id },
          data: { status: 'FAILED' }
        });
      }
    }

    // Emit event
    this.eventEmitter.emit('service.request.submitted', {
      agencyId,
      serviceRequestId: serviceRequest.id,
      swarmExecutionId: swarmExecution?.id
    });

    return {
      serviceRequest,
      swarmExecution,
      estimatedCompletion
    };
  }

  /**
   * Get service request status with swarm execution details
   */
  async getServiceRequestStatus(requestId: string): Promise<{
    serviceRequest: ServiceRequest;
    swarmExecution?: SwarmExecution;
    provider?: ServiceProvider;
    progress: {
      percentage: number;
      currentStep?: string;
      timeRemaining?: number;
      qualityScore?: number;
    };
  }> {
    const serviceRequest = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        provider: true,
        swarmExecutions: true
      }
    });

    if (!serviceRequest) {
      throw new Error(`Service request not found: ${requestId}`);
    }

    const swarmExecution = serviceRequest.swarmExecutions?.[0];
    let progress = {
      percentage: serviceRequest.progress,
      qualityScore: serviceRequest.qualityScore
    };

    if (swarmExecution) {
      const executionDetails = await this.swarmOrchestration.getSwarmExecution(swarmExecution.id);
      if (executionDetails) {
        progress = {
          ...progress,
          currentStep: this.getCurrentExecutionStep(executionDetails),
          timeRemaining: this.calculateTimeRemaining(executionDetails),
          qualityScore: executionDetails.qualityScore || progress.qualityScore
        };
      }
    }

    return {
      serviceRequest,
      swarmExecution,
      provider: serviceRequest.provider,
      progress
    };
  }

  // =====================================================
  // PROVIDER MANAGEMENT
  // =====================================================

  /**
   * Register existing agents as service providers
   */
  private async registerAgentsAsProviders(agencyId: string, agents: any[]): Promise<void> {
    for (const agent of agents) {
      try {
        // Register agent for applicable service categories
        const categories = await this.serviceRouter.getAvailableCategories(agencyId);
        
        for (const category of categories) {
          await this.serviceRouter.registerProvider({
            agentId: agent.id,
            agencyId,
            categoryId: category.id,
            capabilities: this.extractAgentCapabilities(agent),
            skills: this.extractAgentSkills(agent),
            pricing: this.getDefaultProviderPricing(agent)
          });
        }
      } catch (error) {
        this.logger.warn(`Failed to register agent ${agent.id} as provider: ${error.message}`);
      }
    }
  }

  /**
   * Get agency providers with performance metrics
   */
  async getAgencyProviders(agencyId: string): Promise<ServiceProvider[]> {
    return this.serviceRouter.getAgencyProviders(agencyId);
  }

  /**
   * Update provider availability and settings
   */
  async updateProviderSettings(
    providerId: string,
    settings: {
      isAvailable?: boolean;
      hourlyRate?: number;
      maxLoad?: number;
      workPreferences?: Record<string, any>;
    }
  ): Promise<ServiceProvider> {
    return this.serviceRouter.updateProviderSettings(providerId, settings);
  }

  // =====================================================
  // ANALYTICS & REPORTING
  // =====================================================

  /**
   * Get comprehensive agency analytics
   */
  async getAgencyAnalytics(
    agencyId: string,
    timeframe: { start: Date; end: Date }
  ): Promise<{
    overview: {
      totalRequests: number;
      completedRequests: number;
      activeRequests: number;
      averageQualityScore: number;
      averageCompletionTime: number;
      totalRevenue: number;
    };
    performance: {
      topProviders: Array<{ providerId: string; name: string; score: number }>;
      categoryPerformance: Array<{ categoryName: string; completionRate: number; avgQuality: number }>;
      swarmEfficiency: { executionsCompleted: number; averageSteps: number; successRate: number };
    };
    trends: {
      requestVolume: Array<{ date: Date; count: number }>;
      qualityTrend: Array<{ date: Date; score: number }>;
      providerUtilization: Array<{ providerId: string; utilizationRate: number }>;
    };
  }> {
    const [overview, performance, trends] = await Promise.all([
      this.getOverviewMetrics(agencyId, timeframe),
      this.getPerformanceMetrics(agencyId, timeframe),
      this.getTrendMetrics(agencyId, timeframe)
    ]);

    return { overview, performance, trends };
  }

  // =====================================================
  // MISSING METHODS REQUIRED BY APPS-LEVEL CONTROLLER
  // =====================================================

  /**
   * Create a new agency with swarm capabilities enabled
   */
  async createAgencyWithSwarm(dto: EnhancedAgencyDto): Promise<{
    agency: Agency;
    swarmStatus: AgencySwarmStatus;
  }> {
    this.logger.log(`Creating agency with swarm capabilities: ${dto.name}`);

    // Create the agency first using standard creation process
    const agency = await this.prisma.agency.create({
      data: {
        name: dto.name,
        subdomain: dto.subdomain,
        slug: dto.slug || dto.subdomain,
        tier: dto.tier || AgencyTier.STARTER,
        customDomain: dto.customDomain,
        settings: {
          swarmEnabled: dto.enableSwarmOrchestration !== false,
          serviceRoutingEnabled: dto.enableServiceRouting !== false,
          swarmConfig: dto.swarmConfiguration || {
            maxConcurrentExecutions: 10,
            defaultQualityThreshold: 0.8,
            enableAutoScaling: true
          }
        }
      }
    });

    // Initialize swarm capabilities if enabled
    let swarmStatus: AgencySwarmStatus;
    if (dto.enableSwarmOrchestration !== false) {
      swarmStatus = await this.initializeAgencySwarm(agency.id, {
        enabledCategories: dto.defaultServiceCategories,
        qualityThreshold: dto.swarmConfiguration?.defaultQualityThreshold,
        maxConcurrentExecutions: dto.swarmConfiguration?.maxConcurrentExecutions
      });
    } else {
      // Return minimal swarm status for non-swarm agencies
      swarmStatus = {
        agencyId: agency.id,
        isSwarmEnabled: false,
        activeExecutions: 0,
        totalProviders: 0,
        activeProviders: 0,
        availableCategories: [],
        recentActivity: {
          totalRequests: 0,
          completedRequests: 0,
          averageQualityScore: 0,
          averageCompletionTime: 0
        }
      };
    }

    // Emit creation event
    this.eventEmitter.emit('agency.created', {
      agencyId: agency.id,
      swarmEnabled: dto.enableSwarmOrchestration !== false
    });

    return { agency, swarmStatus };
  }

  /**
   * Get agency details with complete swarm status information
   */
  async getAgencyWithSwarmStatus(agencyId: string): Promise<{
    agency: Agency;
    swarmStatus: AgencySwarmStatus;
    providers: ServiceProvider[];
    recentRequests: ServiceRequest[];
  }> {
    this.logger.log(`Getting agency with swarm status: ${agencyId}`);

    const [agency, swarmStatus, providers, recentRequests] = await Promise.all([
      this.prisma.agency.findUnique({
        where: { id: agencyId },
        include: {
          agents: true,
          users: true
        }
      }),
      this.getAgencySwarmStatus(agencyId),
      this.serviceRouter.getAgencyProviders(agencyId),
      this.prisma.serviceRequest.findMany({
        where: { agencyId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          category: true,
          provider: true
        }
      })
    ]);

    if (!agency) {
      throw new Error(`Agency not found: ${agencyId}`);
    }

    return {
      agency,
      swarmStatus,
      providers,
      recentRequests
    };
  }

  /**
   * Update agency configuration including swarm settings
   */
  async updateAgencyConfiguration(
    agencyId: string,
    updates: Partial<EnhancedAgencyDto>
  ): Promise<{
    agency: Agency;
    swarmStatus: AgencySwarmStatus;
  }> {
    this.logger.log(`Updating agency configuration: ${agencyId}`);

    const existingAgency = await this.prisma.agency.findUnique({
      where: { id: agencyId }
    });

    if (!existingAgency) {
      throw new Error(`Agency not found: ${agencyId}`);
    }

    const existingSettings = existingAgency.settings as any || {};

    // Prepare update data
    const updateData: any = {};
    
    if (updates.name) updateData.name = updates.name;
    if (updates.customDomain) updateData.customDomain = updates.customDomain;
    if (updates.tier) updateData.tier = updates.tier;

    // Update swarm configuration
    if (updates.enableSwarmOrchestration !== undefined || updates.swarmConfiguration) {
      updateData.settings = {
        ...existingSettings,
        swarmEnabled: updates.enableSwarmOrchestration !== false,
        serviceRoutingEnabled: updates.enableServiceRouting !== false,
        swarmConfig: {
          ...existingSettings.swarmConfig,
          ...updates.swarmConfiguration
        }
      };
    }

    // Update the agency
    const updatedAgency = await this.prisma.agency.update({
      where: { id: agencyId },
      data: updateData
    });

    // If swarm configuration changed, reinitialize if needed
    let swarmStatus: AgencySwarmStatus;
    if (updates.enableSwarmOrchestration === true && !existingSettings.swarmEnabled) {
      // Enable swarm for the first time
      swarmStatus = await this.initializeAgencySwarm(agencyId, {
        enabledCategories: updates.defaultServiceCategories,
        qualityThreshold: updates.swarmConfiguration?.defaultQualityThreshold,
        maxConcurrentExecutions: updates.swarmConfiguration?.maxConcurrentExecutions
      });
    } else {
      // Get current status
      swarmStatus = await this.getAgencySwarmStatus(agencyId);
    }

    // Emit update event
    this.eventEmitter.emit('agency.updated', {
      agencyId,
      changes: updates
    });

    return { agency: updatedAgency, swarmStatus };
  }

  /**
   * Initialize swarm for an agency (alias for initializeAgencySwarm)
   */
  async initializeSwarm(
    agencyId: string,
    config?: {
      enabledCategories?: string[];
      qualityThreshold?: number;
      maxConcurrentExecutions?: number;
    }
  ): Promise<AgencySwarmStatus> {
    return this.initializeAgencySwarm(agencyId, config);
  }

  /**
   * Get swarm status (alias for getAgencySwarmStatus)
   */
  async getSwarmStatus(agencyId: string): Promise<AgencySwarmStatus> {
    return this.getAgencySwarmStatus(agencyId);
  }

  /**
   * Register service providers for an agency
   */
  async registerProviders(
    agencyId: string,
    providersDto: {
      providers: Array<{
        agentId?: string;
        name: string;
        categoryIds: string[];
        skills: string[];
        capabilities: Record<string, any>[];
        hourlyRate?: number;
        experienceLevel?: 'JUNIOR' | 'INTERMEDIATE' | 'SENIOR' | 'EXPERT';
        isAvailable?: boolean;
      }>;
    }
  ): Promise<{
    registeredProviders: ServiceProvider[];
    errors: Array<{ provider: any; error: string }>;
  }> {
    this.logger.log(`Registering ${providersDto.providers.length} providers for agency: ${agencyId}`);

    const registeredProviders: ServiceProvider[] = [];
    const errors: Array<{ provider: any; error: string }> = [];

    // Verify agency exists
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId }
    });

    if (!agency) {
      throw new Error(`Agency not found: ${agencyId}`);
    }

    for (const providerData of providersDto.providers) {
      try {
        // Register provider for each specified category
        for (const categoryId of providerData.categoryIds) {
          const provider = await this.serviceRouter.registerProvider({
            agentId: providerData.agentId,
            agencyId,
            categoryId,
            name: providerData.name,
            capabilities: providerData.capabilities,
            skills: providerData.skills.map(skill => ({ name: skill, level: 'INTERMEDIATE' })),
            pricing: {
              hourlyRate: providerData.hourlyRate || 50.00,
              currency: 'USD'
            },
            experienceLevel: providerData.experienceLevel || 'INTERMEDIATE',
            isAvailable: providerData.isAvailable !== false
          });

          registeredProviders.push(provider);
        }
      } catch (error) {
        errors.push({
          provider: providerData,
          error: error.message
        });
      }
    }

    // Emit registration event
    this.eventEmitter.emit('providers.registered', {
      agencyId,
      registeredCount: registeredProviders.length,
      errorCount: errors.length
    });

    return { registeredProviders, errors };
  }

  /**
   * Get providers for an agency with optional filtering
   */
  async getProviders(
    agencyId: string,
    filters?: {
      categoryId?: string;
      active?: boolean;
      experienceLevel?: string;
    }
  ): Promise<{
    providers: ServiceProvider[];
    totalCount: number;
    activeCount: number;
    categoryBreakdown: Array<{ categoryId: string; categoryName: string; count: number }>;
  }> {
    this.logger.log(`Getting providers for agency: ${agencyId}`);

    // Build where clause
    const where: any = { agencyId };
    
    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }
    
    if (filters?.active !== undefined) {
      where.isAvailable = filters.active;
    }

    if (filters?.experienceLevel) {
      where.experienceLevel = filters.experienceLevel;
    }

    const [providers, totalCount, activeCount, categoryBreakdown] = await Promise.all([
      this.prisma.serviceProvider.findMany({
        where,
        include: {
          category: true,
          agent: true,
          reviews: {
            take: 5,
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: [
          { isAvailable: 'desc' },
          { averageRating: 'desc' }
        ]
      }),
      this.prisma.serviceProvider.count({ where: { agencyId } }),
      this.prisma.serviceProvider.count({ 
        where: { agencyId, isAvailable: true } 
      }),
      this.prisma.serviceProvider.groupBy({
        by: ['categoryId'],
        where: { agencyId },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
      })
    ]);

    // Enhance category breakdown with names
    const categories = await this.prisma.serviceCategory.findMany({
      where: {
        id: { in: categoryBreakdown.map(cb => cb.categoryId) }
      }
    });

    const enhancedCategoryBreakdown = categoryBreakdown.map(cb => {
      const category = categories.find(c => c.id === cb.categoryId);
      return {
        categoryId: cb.categoryId,
        categoryName: category?.name || 'Unknown',
        count: cb._count.id
      };
    });

    return {
      providers,
      totalCount,
      activeCount,
      categoryBreakdown: enhancedCategoryBreakdown
    };
  }

  /**
   * Get analytics for an agency with time-based filtering
   */
  async getAnalytics(
    agencyId: string,
    timeframe: string = '30d'
  ): Promise<{
    overview: {
      totalRequests: number;
      completedRequests: number;
      activeRequests: number;
      averageQualityScore: number;
      averageCompletionTime: number;
      totalRevenue: number;
    };
    performance: {
      topProviders: Array<{ providerId: string; name: string; score: number; completedTasks: number }>;
      categoryPerformance: Array<{ categoryName: string; completionRate: number; avgQuality: number }>;
      swarmEfficiency: { executionsCompleted: number; averageSteps: number; successRate: number };
    };
    trends: {
      requestVolume: Array<{ date: string; count: number }>;
      qualityTrend: Array<{ date: string; score: number }>;
      providerUtilization: Array<{ providerId: string; name: string; utilizationRate: number }>;
    };
  }> {
    this.logger.log(`Getting analytics for agency: ${agencyId} (timeframe: ${timeframe})`);

    // Parse timeframe
    const timeframeDays = parseInt(timeframe.replace('d', '')) || 30;
    const startDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const [overview, performance, trends] = await Promise.all([
      this.getOverviewMetrics(agencyId, { start: startDate, end: endDate }),
      this.getPerformanceMetrics(agencyId, { start: startDate, end: endDate }),
      this.getTrendMetrics(agencyId, { start: startDate, end: endDate })
    ]);

    return { overview, performance, trends };
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  private async getRecentServiceActivity(agencyId: string): Promise<{
    totalRequests: number;
    completedRequests: number;
    averageQualityScore: number;
    averageCompletionTime: number;
  }> {
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const requests = await this.prisma.serviceRequest.findMany({
      where: {
        agencyId,
        createdAt: { gte: lastMonth }
      }
    });

    const completedRequests = requests.filter(r => r.status === 'COMPLETED');
    const totalCompletionTime = completedRequests.reduce((sum, r) => {
      if (r.completedAt && r.startedAt) {
        return sum + (r.completedAt.getTime() - r.startedAt.getTime());
      }
      return sum;
    }, 0);

    const totalQualityScore = completedRequests.reduce((sum, r) => sum + (r.qualityScore || 0), 0);

    return {
      totalRequests: requests.length,
      completedRequests: completedRequests.length,
      averageQualityScore: completedRequests.length > 0 ? totalQualityScore / completedRequests.length : 0,
      averageCompletionTime: completedRequests.length > 0 ? totalCompletionTime / completedRequests.length : 0
    };
  }

  private calculateEstimatedCompletion(category: ServiceCategory, estimatedDuration: number): Date {
    // Add buffer time based on category complexity
    const complexity = category.complexityLevel;
    const bufferMultiplier = {
      'SIMPLE': 1.2,
      'MODERATE': 1.5,
      'COMPLEX': 2.0,
      'EXPERT': 2.5
    }[complexity] || 1.5;

    const estimatedMs = estimatedDuration * 60 * 60 * 1000 * bufferMultiplier;
    return new Date(Date.now() + estimatedMs);
  }

  private getCurrentExecutionStep(execution: SwarmExecution): string | undefined {
    // Extract current step from execution plan
    const executionPlan = execution.executionPlan as any[];
    const currentStep = executionPlan?.find(step => step.status === 'RUNNING');
    return currentStep?.action || 'Processing...';
  }

  private calculateTimeRemaining(execution: SwarmExecution): number | undefined {
    if (!execution.startedAt) return undefined;
    
    const elapsed = Date.now() - execution.startedAt.getTime();
    const executionPlan = execution.executionPlan as any[];
    const totalSteps = executionPlan?.length || 1;
    const completedSteps = executionPlan?.filter(step => step.status === 'COMPLETED').length || 0;
    
    if (completedSteps === 0) return undefined;
    
    const avgStepTime = elapsed / completedSteps;
    const remainingSteps = totalSteps - completedSteps;
    
    return remainingSteps * avgStepTime;
  }

  private extractAgentCapabilities(agent: any): Record<string, any>[] {
    // Extract capabilities from agent metadata
    return agent.capabilities || [];
  }

  private extractAgentSkills(agent: any): Record<string, any>[] {
    // Extract skills from agent configuration
    return agent.skills || [];
  }

  private getDefaultProviderPricing(agent: any): { hourlyRate: number; currency: string } {
    return {
      hourlyRate: 50.00, // Default rate
      currency: 'USD'
    };
  }

  private async getOverviewMetrics(agencyId: string, timeframe: { start: Date; end: Date }): Promise<{
    totalRequests: number;
    completedRequests: number;
    activeRequests: number;
    averageQualityScore: number;
    averageCompletionTime: number;
    totalRevenue: number;
  }> {
    const requests = await this.prisma.serviceRequest.findMany({
      where: {
        agencyId,
        createdAt: { gte: timeframe.start, lte: timeframe.end }
      }
    });

    const completedRequests = requests.filter(r => r.status === 'COMPLETED');
    const activeRequests = requests.filter(r => ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(r.status));

    const totalCompletionTime = completedRequests.reduce((sum, r) => {
      if (r.completedAt && r.startedAt) {
        return sum + (r.completedAt.getTime() - r.startedAt.getTime());
      }
      return sum;
    }, 0);

    const totalQualityScore = completedRequests.reduce((sum, r) => sum + (r.qualityScore || 0), 0);

    const totalRevenue = completedRequests.reduce((sum, r) => {
      const budget = r.budget as any;
      return sum + (budget?.max || budget?.amount || 0);
    }, 0);

    return {
      totalRequests: requests.length,
      completedRequests: completedRequests.length,
      activeRequests: activeRequests.length,
      averageQualityScore: completedRequests.length > 0 ? totalQualityScore / completedRequests.length : 0,
      averageCompletionTime: completedRequests.length > 0 ? totalCompletionTime / completedRequests.length : 0,
      totalRevenue
    };
  }

  private async getPerformanceMetrics(agencyId: string, timeframe: { start: Date; end: Date }): Promise<{
    topProviders: Array<{ providerId: string; name: string; score: number; completedTasks: number }>;
    categoryPerformance: Array<{ categoryName: string; completionRate: number; avgQuality: number }>;
    swarmEfficiency: { executionsCompleted: number; averageSteps: number; successRate: number };
  }> {
    // Get top providers
    const providerPerformance = await this.prisma.serviceRequest.groupBy({
      by: ['providerId'],
      where: {
        agencyId,
        createdAt: { gte: timeframe.start, lte: timeframe.end },
        providerId: { not: null }
      },
      _count: { id: true },
      _avg: { qualityScore: true }
    });

    const providers = await this.prisma.serviceProvider.findMany({
      where: {
        id: { in: providerPerformance.map(p => p.providerId).filter(Boolean) }
      }
    });

    const topProviders = providerPerformance
      .map(p => {
        const provider = providers.find(pr => pr.id === p.providerId);
        return {
          providerId: p.providerId || '',
          name: provider?.name || 'Unknown',
          score: p._avg.qualityScore || 0,
          completedTasks: p._count.id
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Get category performance
    const categoryPerformance = await this.prisma.serviceRequest.groupBy({
      by: ['categoryId'],
      where: {
        agencyId,
        createdAt: { gte: timeframe.start, lte: timeframe.end }
      },
      _count: { id: true },
      _avg: { qualityScore: true }
    });

    const categories = await this.prisma.serviceCategory.findMany({
      where: {
        id: { in: categoryPerformance.map(cp => cp.categoryId) }
      }
    });

    const categoryStats = await Promise.all(
      categoryPerformance.map(async cp => {
        const category = categories.find(c => c.id === cp.categoryId);
        const completedCount = await this.prisma.serviceRequest.count({
          where: {
            agencyId,
            categoryId: cp.categoryId,
            status: 'COMPLETED',
            createdAt: { gte: timeframe.start, lte: timeframe.end }
          }
        });

        return {
          categoryName: category?.name || 'Unknown',
          completionRate: cp._count.id > 0 ? (completedCount / cp._count.id) * 100 : 0,
          avgQuality: cp._avg.qualityScore || 0
        };
      })
    );

    // Get swarm efficiency
    const swarmExecutions = await this.prisma.swarmExecution.findMany({
      where: {
        agencyId,
        createdAt: { gte: timeframe.start, lte: timeframe.end }
      },
      include: {
        steps: true
      }
    });

    const completedExecutions = swarmExecutions.filter(e => e.status === 'COMPLETED');
    const totalSteps = swarmExecutions.reduce((sum, e) => sum + e.steps.length, 0);
    const successCount = swarmExecutions.filter(e => e.status === 'COMPLETED').length;

    return {
      topProviders,
      categoryPerformance: categoryStats,
      swarmEfficiency: {
        executionsCompleted: completedExecutions.length,
        averageSteps: swarmExecutions.length > 0 ? totalSteps / swarmExecutions.length : 0,
        successRate: swarmExecutions.length > 0 ? (successCount / swarmExecutions.length) * 100 : 0
      }
    };
  }

  private async getTrendMetrics(agencyId: string, timeframe: { start: Date; end: Date }): Promise<{
    requestVolume: Array<{ date: string; count: number }>;
    qualityTrend: Array<{ date: string; score: number }>;
    providerUtilization: Array<{ providerId: string; name: string; utilizationRate: number }>;
  }> {
    // Generate daily buckets for the timeframe
    const days = Math.ceil((timeframe.end.getTime() - timeframe.start.getTime()) / (1000 * 60 * 60 * 24));
    const requestVolume: Array<{ date: string; count: number }> = [];
    const qualityTrend: Array<{ date: string; score: number }> = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(timeframe.start.getTime() + i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      
      const [dayRequests, dayQuality] = await Promise.all([
        this.prisma.serviceRequest.count({
          where: {
            agencyId,
            createdAt: { gte: date, lt: nextDate }
          }
        }),
        this.prisma.serviceRequest.aggregate({
          where: {
            agencyId,
            status: 'COMPLETED',
            createdAt: { gte: date, lt: nextDate }
          },
          _avg: { qualityScore: true }
        })
      ]);

      requestVolume.push({
        date: date.toISOString().split('T')[0],
        count: dayRequests
      });

      qualityTrend.push({
        date: date.toISOString().split('T')[0],
        score: dayQuality._avg.qualityScore || 0
      });
    }

    // Calculate provider utilization
    const providers = await this.prisma.serviceProvider.findMany({
      where: { agencyId },
      include: {
        serviceRequests: {
          where: {
            createdAt: { gte: timeframe.start, lte: timeframe.end }
          }
        }
      }
    });

    const providerUtilization = providers.map(provider => {
      const totalRequests = provider.serviceRequests.length;
      const completedRequests = provider.serviceRequests.filter(r => r.status === 'COMPLETED').length;
      
      return {
        providerId: provider.id,
        name: provider.name,
        utilizationRate: totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0
      };
    });

    return {
      requestVolume,
      qualityTrend,
      providerUtilization
    };
  }
}
