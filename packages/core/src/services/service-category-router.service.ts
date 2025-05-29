/**
 * Service Category Router
 * Implements intelligent service category routing and provider matching
 * Inspired by the Python Agency Hub's service-oriented design
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
import { AgencyHubCacheService } from './agency-hub-cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { 
  Agent, 
  Agency, 
  AgencyTier,
  User 
} from '@prisma/client';

// =====================================================
// SERVICE CATEGORY SYSTEM
// =====================================================

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  parentCategoryId?: string;
  subcategories: string[];
  requiredCapabilities: string[];
  complexityLevel: 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'EXPERT';
  estimatedDuration: {
    min: number; // hours
    max: number;
    typical: number;
  };
  pricing: {
    tierMultipliers: Record<AgencyTier, number>;
    baseRate: number;
    currency: string;
  };
  qualityThresholds: {
    minimum: number;
    target: number;
    exceptional: number;
  };
  metadata: Record<string, any>;
}

export interface ServiceProvider {
  id: string;
  agentId: string;
  agencyId: string;
  categories: string[];
  capabilities: ProviderCapability[];
  availability: ProviderAvailability;
  performance: ProviderPerformance;
  pricing: ProviderPricing;
  certification: ProviderCertification[];
  metadata: Record<string, any>;
}

export interface ProviderCapability {
  categoryId: string;
  skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  specializations: string[];
  tools: string[];
  certifications: string[];
  lastUpdated: Date;
}

export interface ProviderAvailability {
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'MAINTENANCE';
  capacity: number; // 0-100%
  schedule: TimeSlot[];
  timezone: string;
  responseTime: number; // average minutes
  nextAvailable?: Date;
}

export interface TimeSlot {
  dayOfWeek: number; // 0-6
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  available: boolean;
}

export interface ProviderPerformance {
  totalJobs: number;
  completedJobs: number;
  averageRating: number;
  averageCompletionTime: number; // hours
  qualityScore: number;
  reliabilityScore: number;
  lastUpdated: Date;
  recentReviews: ProviderReview[];
}

export interface ProviderReview {
  requestId: string;
  rating: number; // 1-5
  qualityScore: number;
  timelinessScore: number;
  communicationScore: number;
  feedback: string;
  createdAt: Date;
}

export interface ProviderPricing {
  hourlyRate: number;
  projectRates: Record<string, number>; // by category
  discounts: PricingDiscount[];
  currency: string;
  negotiable: boolean;
}

export interface PricingDiscount {
  type: 'VOLUME' | 'LOYALTY' | 'FIRST_TIME' | 'SEASONAL';
  threshold: number;
  discountPercent: number;
  validUntil?: Date;
}

export interface ProviderCertification {
  name: string;
  issuer: string;
  issuedDate: Date;
  expiryDate?: Date;
  verificationUrl?: string;
  level: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
}

export interface ServiceMatchingRequest {
  serviceRequestId: string;
  categoryId: string;
  requirements: ServiceRequirements;
  constraints: ServiceConstraints;
  preferences: ServicePreferences;
  agencyId: string;
  requesterId: string;
}

export interface ServiceRequirements {
  complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'EXPERT';
  skills: string[];
  experience: 'ANY' | 'JUNIOR' | 'SENIOR' | 'EXPERT';
  tools: string[];
  deliverables: string[];
  qualityLevel: 'BASIC' | 'STANDARD' | 'HIGH' | 'PREMIUM';
}

export interface ServiceConstraints {
  budget: {
    min?: number;
    max?: number;
    currency: string;
  };
  timeline: {
    startDate?: Date;
    deadline: Date;
    flexibility: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  };
  location?: {
    required: boolean;
    regions: string[];
    timezone?: string;
  };
}

export interface ServicePreferences {
  providerType: 'ANY' | 'INDIVIDUAL' | 'TEAM' | 'SPECIALIST';
  communication: 'MINIMAL' | 'REGULAR' | 'FREQUENT';
  reporting: 'BASIC' | 'DETAILED' | 'COMPREHENSIVE';
  priorityFactors: {
    cost: number; // weight 0-1
    quality: number;
    speed: number;
    reliability: number;
  };
}

export interface ProviderMatch {
  provider: ServiceProvider;
  matchScore: number; // 0-1
  matchReasons: string[];
  estimatedCost: number;
  estimatedDuration: number; // hours
  availabilityDate: Date;
  qualityPrediction: number;
  riskFactors: string[];
  alternatives?: ProviderMatch[];
}

// =====================================================
// MAIN SERVICE IMPLEMENTATION
// =====================================================

@Injectable()
export class ServiceCategoryRouterService {
  private readonly logger = new Logger(ServiceCategoryRouterService.name);
  private readonly categoryCache = new Map<string, ServiceCategory>();
  private readonly providerCache = new Map<string, ServiceProvider>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: AgencyHubCacheService,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.initializeServiceCategories();
  }

  // =====================================================
  // SERVICE CATEGORY MANAGEMENT
  // =====================================================

  /**
   * Initialize default service categories
   */
  private async initializeServiceCategories(): Promise<void> {
    const defaultCategories: ServiceCategory[] = [
      {
        id: 'business_analysis',
        name: 'Business Analysis',
        description: 'Business research, market analysis, competitive intelligence',
        subcategories: ['market_research', 'competitive_analysis', 'business_planning'],
        requiredCapabilities: ['research', 'analysis', 'reporting'],
        complexityLevel: 'MODERATE',
        estimatedDuration: { min: 4, max: 40, typical: 16 },
        pricing: {
          tierMultipliers: {
            [AgencyTier.TRIAL]: 0.5,
            [AgencyTier.STARTER]: 0.8,
            [AgencyTier.PROFESSIONAL]: 1.0,
            [AgencyTier.ENTERPRISE]: 1.2,
            [AgencyTier.WHITE_LABEL]: 1.5
          },
          baseRate: 75,
          currency: 'USD'
        },
        qualityThresholds: { minimum: 0.7, target: 0.85, exceptional: 0.95 },
        metadata: {}
      },
      {
        id: 'content_creation',
        name: 'Content Creation',
        description: 'Content writing, blog posts, marketing materials, documentation',
        subcategories: ['blog_writing', 'technical_writing', 'marketing_copy', 'documentation'],
        requiredCapabilities: ['writing', 'creativity', 'research', 'editing'],
        complexityLevel: 'MODERATE',
        estimatedDuration: { min: 2, max: 20, typical: 8 },
        pricing: {
          tierMultipliers: {
            [AgencyTier.TRIAL]: 0.4,
            [AgencyTier.STARTER]: 0.7,
            [AgencyTier.PROFESSIONAL]: 1.0,
            [AgencyTier.ENTERPRISE]: 1.3,
            [AgencyTier.WHITE_LABEL]: 1.6
          },
          baseRate: 50,
          currency: 'USD'
        },
        qualityThresholds: { minimum: 0.75, target: 0.88, exceptional: 0.96 },
        metadata: {}
      },
      {
        id: 'technical_development',
        name: 'Technical Development',
        description: 'Software development, system integration, technical implementation',
        subcategories: ['web_development', 'api_development', 'system_integration', 'automation'],
        requiredCapabilities: ['programming', 'system_design', 'testing', 'deployment'],
        complexityLevel: 'COMPLEX',
        estimatedDuration: { min: 8, max: 200, typical: 50 },
        pricing: {
          tierMultipliers: {
            [AgencyTier.TRIAL]: 0.6,
            [AgencyTier.STARTER]: 0.9,
            [AgencyTier.PROFESSIONAL]: 1.0,
            [AgencyTier.ENTERPRISE]: 1.1,
            [AgencyTier.WHITE_LABEL]: 1.3
          },
          baseRate: 120,
          currency: 'USD'
        },
        qualityThresholds: { minimum: 0.8, target: 0.9, exceptional: 0.98 },
        metadata: {}
      },
      {
        id: 'social_media_management',
        name: 'Social Media Management',
        description: 'Social media strategy, content scheduling, community management',
        subcategories: ['strategy', 'content_scheduling', 'community_management', 'analytics'],
        requiredCapabilities: ['social_media', 'marketing', 'communication', 'analytics'],
        complexityLevel: 'MODERATE',
        estimatedDuration: { min: 1, max: 10, typical: 4 },
        pricing: {
          tierMultipliers: {
            [AgencyTier.TRIAL]: 0.5,
            [AgencyTier.STARTER]: 0.8,
            [AgencyTier.PROFESSIONAL]: 1.0,
            [AgencyTier.ENTERPRISE]: 1.2,
            [AgencyTier.WHITE_LABEL]: 1.4
          },
          baseRate: 40,
          currency: 'USD'
        },
        qualityThresholds: { minimum: 0.7, target: 0.85, exceptional: 0.93 },
        metadata: {}
      },
      {
        id: 'customer_support',
        name: 'Customer Support',
        description: 'Customer service, technical support, issue resolution',
        subcategories: ['general_support', 'technical_support', 'escalation_handling'],
        requiredCapabilities: ['communication', 'problem_solving', 'patience', 'technical_knowledge'],
        complexityLevel: 'SIMPLE',
        estimatedDuration: { min: 0.25, max: 4, typical: 1 },
        pricing: {
          tierMultipliers: {
            [AgencyTier.TRIAL]: 0.6,
            [AgencyTier.STARTER]: 0.8,
            [AgencyTier.PROFESSIONAL]: 1.0,
            [AgencyTier.ENTERPRISE]: 1.1,
            [AgencyTier.WHITE_LABEL]: 1.2
          },
          baseRate: 25,
          currency: 'USD'
        },
        qualityThresholds: { minimum: 0.8, target: 0.9, exceptional: 0.97 },
        metadata: {}
      }
    ];

    // Cache categories
    defaultCategories.forEach(category => {
      this.categoryCache.set(category.id, category);
    });

    this.logger.log(`Initialized ${defaultCategories.length} service categories`);
  }

  /**
   * Get service category by ID
   */
  async getServiceCategory(categoryId: string): Promise<ServiceCategory | null> {
    // Check cache first
    if (this.categoryCache.has(categoryId)) {
      return this.categoryCache.get(categoryId)!;
    }

    // In a real implementation, this would query the database
    // For now, return null for non-cached categories
    return null;
  }

  /**
   * Get all available service categories for an agency tier
   */
  async getAvailableCategories(agencyTier: AgencyTier): Promise<ServiceCategory[]> {
    const allCategories = Array.from(this.categoryCache.values());
    
    // Filter categories based on tier restrictions
    return allCategories.filter(category => {
      // Simple tier-based filtering - more complex logic could be added
      if (agencyTier === AgencyTier.TRIAL) {
        return category.complexityLevel !== 'EXPERT';
      }
      if (agencyTier === AgencyTier.STARTER) {
        return category.complexityLevel !== 'EXPERT';
      }
      return true; // All categories available for higher tiers
    });
  }

  // =====================================================
  // PROVIDER MANAGEMENT
  // =====================================================

  /**
   * Register a new service provider
   */
  async registerProvider(agentId: string, categories: string[], capabilities: ProviderCapability[]): Promise<ServiceProvider> {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      include: { agency: true }
    });

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const provider: ServiceProvider = {
      id: `provider_${agentId}`,
      agentId,
      agencyId: agent.agencyId,
      categories,
      capabilities,
      availability: {
        status: 'AVAILABLE',
        capacity: 100,
        schedule: this.createDefaultSchedule(),
        timezone: 'UTC',
        responseTime: 15 // 15 minutes average
      },
      performance: {
        totalJobs: 0,
        completedJobs: 0,
        averageRating: 4.0,
        averageCompletionTime: 8,
        qualityScore: 0.85,
        reliabilityScore: 0.9,
        lastUpdated: new Date(),
        recentReviews: []
      },
      pricing: {
        hourlyRate: 50,
        projectRates: {},
        discounts: [],
        currency: 'USD',
        negotiable: true
      },
      certification: [],
      metadata: {}
    };

    // Cache the provider
    this.providerCache.set(provider.id, provider);

    this.logger.log(`Registered new service provider: ${provider.id} for agent: ${agentId}`);

    return provider;
  }

  /**
   * Find matching providers for a service request
   */
  async findMatchingProviders(request: ServiceMatchingRequest): Promise<ProviderMatch[]> {
    this.logger.log(`Finding providers for category: ${request.categoryId}`);

    // 1. Get category information
    const category = await this.getServiceCategory(request.categoryId);
    if (!category) {
      throw new Error(`Service category not found: ${request.categoryId}`);
    }

    // 2. Get all providers in the category
    const categoryProviders = await this.getProvidersInCategory(request.categoryId, request.agencyId);

    // 3. Filter by requirements and constraints
    const eligibleProviders = await this.filterProvidersByRequirements(
      categoryProviders,
      request.requirements,
      request.constraints
    );

    // 4. Calculate match scores
    const scoredMatches = await Promise.all(
      eligibleProviders.map(provider => this.calculateProviderMatch(provider, request, category))
    );

    // 5. Sort by match score and preferences
    const sortedMatches = this.sortProviderMatches(scoredMatches, request.preferences);

    // 6. Add alternatives for top matches
    return this.addMatchAlternatives(sortedMatches.slice(0, 10)); // Top 10 matches
  }

  /**
   * Get providers in a specific category for an agency
   */
  private async getProvidersInCategory(categoryId: string, agencyId: string): Promise<ServiceProvider[]> {
    // In a real implementation, this would query the database
    // For now, filter cached providers
    return Array.from(this.providerCache.values())
      .filter(provider => 
        provider.agencyId === agencyId && 
        provider.categories.includes(categoryId)
      );
  }

  /**
   * Filter providers by requirements and constraints
   */
  private async filterProvidersByRequirements(
    providers: ServiceProvider[],
    requirements: ServiceRequirements,
    constraints: ServiceConstraints
  ): Promise<ServiceProvider[]> {
    return providers.filter(provider => {
      // Check capability requirements
      const hasRequiredSkills = requirements.skills.every(skill =>
        provider.capabilities.some(cap => cap.specializations.includes(skill))
      );

      // Check experience level
      const meetsExperienceLevel = this.checkExperienceLevel(provider, requirements.experience);

      // Check budget constraints
      const withinBudget = this.checkBudgetConstraints(provider, constraints.budget);

      // Check availability
      const isAvailable = this.checkAvailability(provider, constraints.timeline);

      return hasRequiredSkills && meetsExperienceLevel && withinBudget && isAvailable;
    });
  }

  /**
   * Calculate provider match score and details
   */
  private async calculateProviderMatch(
    provider: ServiceProvider,
    request: ServiceMatchingRequest,
    category: ServiceCategory
  ): Promise<ProviderMatch> {
    const matchScore = this.calculateMatchScore(provider, request, category);
    const estimatedCost = this.calculateEstimatedCost(provider, request, category);
    const estimatedDuration = this.calculateEstimatedDuration(provider, request, category);
    const availabilityDate = this.calculateAvailabilityDate(provider, request.constraints.timeline);
    const qualityPrediction = this.predictQuality(provider, request, category);
    const riskFactors = this.identifyRiskFactors(provider, request, category);
    const matchReasons = this.generateMatchReasons(provider, request, category);

    return {
      provider,
      matchScore,
      matchReasons,
      estimatedCost,
      estimatedDuration,
      availabilityDate,
      qualityPrediction,
      riskFactors
    };
  }

  // =====================================================
  // MATCHING ALGORITHMS
  // =====================================================

  /**
   * Calculate overall match score (0-1)
   */
  private calculateMatchScore(
    provider: ServiceProvider,
    request: ServiceMatchingRequest,
    category: ServiceCategory
  ): number {
    const weights = {
      skillMatch: 0.3,
      experience: 0.2,
      performance: 0.2,
      availability: 0.15,
      cost: 0.15
    };

    const skillScore = this.calculateSkillMatchScore(provider, request.requirements);
    const experienceScore = this.calculateExperienceScore(provider, request.requirements);
    const performanceScore = provider.performance.qualityScore;
    const availabilityScore = this.calculateAvailabilityScore(provider, request.constraints.timeline);
    const costScore = this.calculateCostScore(provider, request.constraints.budget, category);

    return (
      skillScore * weights.skillMatch +
      experienceScore * weights.experience +
      performanceScore * weights.performance +
      availabilityScore * weights.availability +
      costScore * weights.cost
    );
  }

  /**
   * Calculate skill match score
   */
  private calculateSkillMatchScore(provider: ServiceProvider, requirements: ServiceRequirements): number {
    const requiredSkills = requirements.skills;
    const providerSkills = provider.capabilities.flatMap(cap => cap.specializations);
    
    if (requiredSkills.length === 0) return 1.0;
    
    const matchedSkills = requiredSkills.filter(skill => 
      providerSkills.some(pSkill => 
        pSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(pSkill.toLowerCase())
      )
    );

    return matchedSkills.length / requiredSkills.length;
  }

  /**
   * Calculate experience score based on provider capabilities
   */
  private calculateExperienceScore(provider: ServiceProvider, requirements: ServiceRequirements): number {
    const experienceMap = {
      'ANY': 0.5,
      'JUNIOR': 0.6,
      'SENIOR': 0.8,
      'EXPERT': 1.0
    };

    const requiredLevel = experienceMap[requirements.experience] || 0.5;
    
    const avgSkillLevel = provider.capabilities.reduce((sum, cap) => {
      const levelMap = { 'BEGINNER': 0.25, 'INTERMEDIATE': 0.5, 'ADVANCED': 0.75, 'EXPERT': 1.0 };
      return sum + (levelMap[cap.skillLevel] || 0.5);
    }, 0) / provider.capabilities.length;

    return Math.min(avgSkillLevel / requiredLevel, 1.0);
  }

  /**
   * Calculate availability score
   */
  private calculateAvailabilityScore(provider: ServiceProvider, timeline: ServiceConstraints['timeline']): number {
    const availability = provider.availability;
    
    if (availability.status !== 'AVAILABLE') return 0.2;
    
    const capacityScore = availability.capacity / 100;
    const responseScore = Math.max(0, 1 - (availability.responseTime / 60)); // Penalize slow response
    
    // Check timeline compatibility
    const timelineScore = timeline.deadline > new Date() ? 1.0 : 0.0;
    
    return (capacityScore + responseScore + timelineScore) / 3;
  }

  /**
   * Calculate cost score (inverse - lower cost = higher score)
   */
  private calculateCostScore(
    provider: ServiceProvider,
    budget: ServiceConstraints['budget'],
    category: ServiceCategory
  ): number {
    if (!budget.max) return 1.0; // No budget constraint
    
    const estimatedCost = provider.pricing.hourlyRate * category.estimatedDuration.typical;
    
    if (estimatedCost > budget.max) return 0.0;
    if (budget.min && estimatedCost < budget.min) return 0.8; // Suspiciously low
    
    // Score based on how well it fits in the budget range
    const budgetRange = (budget.max - (budget.min || 0));
    const costPosition = estimatedCost - (budget.min || 0);
    
    return Math.max(0, 1 - (costPosition / budgetRange));
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private checkExperienceLevel(provider: ServiceProvider, requiredExperience: string): boolean {
    if (requiredExperience === 'ANY') return true;
    
    const experienceOrder = ['ANY', 'JUNIOR', 'SENIOR', 'EXPERT'];
    const providerLevel = provider.capabilities.some(cap => cap.skillLevel === 'EXPERT') ? 'EXPERT' :
                         provider.capabilities.some(cap => cap.skillLevel === 'ADVANCED') ? 'SENIOR' :
                         'JUNIOR';
    
    const requiredIndex = experienceOrder.indexOf(requiredExperience);
    const providerIndex = experienceOrder.indexOf(providerLevel);
    
    return providerIndex >= requiredIndex;
  }

  private checkBudgetConstraints(provider: ServiceProvider, budget: ServiceConstraints['budget']): boolean {
    if (!budget.max) return true;
    
    const hourlyRate = provider.pricing.hourlyRate;
    return hourlyRate <= (budget.max / 8); // Assume 8-hour estimate for quick check
  }

  private checkAvailability(provider: ServiceProvider, timeline: ServiceConstraints['timeline']): boolean {
    if (provider.availability.status !== 'AVAILABLE') return false;
    if (provider.availability.capacity < 20) return false; // Need at least 20% capacity
    
    // Check if deadline is achievable
    const now = new Date();
    const deadline = timeline.deadline;
    const minTimeNeeded = 4 * 60 * 60 * 1000; // 4 hours minimum
    
    return (deadline.getTime() - now.getTime()) >= minTimeNeeded;
  }

  private calculateEstimatedCost(
    provider: ServiceProvider,
    request: ServiceMatchingRequest,
    category: ServiceCategory
  ): number {
    const baseHours = category.estimatedDuration.typical;
    const complexityMultiplier = this.getComplexityMultiplier(request.requirements.complexity);
    const tierMultiplier = category.pricing.tierMultipliers[AgencyTier.PROFESSIONAL]; // Default tier
    
    return provider.pricing.hourlyRate * baseHours * complexityMultiplier * tierMultiplier;
  }

  private calculateEstimatedDuration(
    provider: ServiceProvider,
    request: ServiceMatchingRequest,
    category: ServiceCategory
  ): number {
    const baseHours = category.estimatedDuration.typical;
    const complexityMultiplier = this.getComplexityMultiplier(request.requirements.complexity);
    const providerEfficiency = provider.performance.reliabilityScore;
    
    return baseHours * complexityMultiplier / providerEfficiency;
  }

  private calculateAvailabilityDate(
    provider: ServiceProvider,
    timeline: ServiceConstraints['timeline']
  ): Date {
    const now = new Date();
    const responseDelay = provider.availability.responseTime * 60 * 1000; // Convert to milliseconds
    
    return new Date(now.getTime() + responseDelay);
  }

  private predictQuality(
    provider: ServiceProvider,
    request: ServiceMatchingRequest,
    category: ServiceCategory
  ): number {
    const baseQuality = provider.performance.qualityScore;
    const complexityPenalty = this.getComplexityPenalty(request.requirements.complexity);
    const categoryBonus = provider.capabilities.some(cap => 
      cap.categoryId === request.categoryId && cap.skillLevel === 'EXPERT'
    ) ? 0.1 : 0;
    
    return Math.min(1.0, baseQuality - complexityPenalty + categoryBonus);
  }

  private identifyRiskFactors(
    provider: ServiceProvider,
    request: ServiceMatchingRequest,
    category: ServiceCategory
  ): string[] {
    const risks: string[] = [];
    
    if (provider.performance.completedJobs < 5) {
      risks.push('Limited track record');
    }
    
    if (provider.performance.averageRating < 4.0) {
      risks.push('Below average ratings');
    }
    
    if (provider.availability.capacity < 50) {
      risks.push('Limited capacity');
    }
    
    if (request.constraints.timeline.deadline < new Date(Date.now() + 24 * 60 * 60 * 1000)) {
      risks.push('Tight deadline');
    }
    
    if (request.requirements.complexity === 'EXPERT' && 
        !provider.capabilities.some(cap => cap.skillLevel === 'EXPERT')) {
      risks.push('Complexity mismatch');
    }
    
    return risks;
  }

  private generateMatchReasons(
    provider: ServiceProvider,
    request: ServiceMatchingRequest,
    category: ServiceCategory
  ): string[] {
    const reasons: string[] = [];
    
    if (provider.performance.qualityScore > 0.9) {
      reasons.push('Exceptional quality track record');
    }
    
    if (provider.performance.averageRating >= 4.5) {
      reasons.push('Highly rated by previous clients');
    }
    
    const hasExpertise = provider.capabilities.some(cap => 
      cap.categoryId === request.categoryId && cap.skillLevel === 'EXPERT'
    );
    if (hasExpertise) {
      reasons.push('Expert-level skills in required category');
    }
    
    if (provider.availability.responseTime < 30) {
      reasons.push('Fast response time');
    }
    
    if (provider.availability.capacity > 80) {
      reasons.push('High availability');
    }
    
    return reasons;
  }

  private sortProviderMatches(matches: ProviderMatch[], preferences: ServicePreferences): ProviderMatch[] {
    return matches.sort((a, b) => {
      // Apply preference weights to create composite score
      const scoreA = this.calculatePreferenceScore(a, preferences);
      const scoreB = this.calculatePreferenceScore(b, preferences);
      
      return scoreB - scoreA; // Descending order
    });
  }

  private calculatePreferenceScore(match: ProviderMatch, preferences: ServicePreferences): number {
    const factors = preferences.priorityFactors;
    
    const costScore = 1 - (match.estimatedCost / 1000); // Normalize cost (assuming max $1000)
    const qualityScore = match.qualityPrediction;
    const speedScore = 1 - (match.estimatedDuration / 100); // Normalize duration (assuming max 100 hours)
    const reliabilityScore = match.provider.performance.reliabilityScore;
    
    return (
      costScore * factors.cost +
      qualityScore * factors.quality +
      speedScore * factors.speed +
      reliabilityScore * factors.reliability
    );
  }

  private addMatchAlternatives(matches: ProviderMatch[]): ProviderMatch[] {
    // Add up to 2 alternatives for each top match
    return matches.map((match, index) => {
      if (index < 3) { // Only for top 3 matches
        const alternatives = matches
          .slice(index + 1, index + 3)
          .filter(alt => alt.matchScore > 0.6); // Only good alternatives
        
        return { ...match, alternatives };
      }
      return match;
    });
  }

  private createDefaultSchedule(): TimeSlot[] {
    const schedule: TimeSlot[] = [];
    for (let day = 0; day < 7; day++) {
      schedule.push({
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        available: day < 5 // Monday to Friday
      });
    }
    return schedule;
  }

  private getComplexityMultiplier(complexity: string): number {
    const multipliers = {
      'SIMPLE': 0.8,
      'MODERATE': 1.0,
      'COMPLEX': 1.5,
      'EXPERT': 2.0
    };
    return multipliers[complexity] || 1.0;
  }

  private getComplexityPenalty(complexity: string): number {
    const penalties = {
      'SIMPLE': 0,
      'MODERATE': 0.05,
      'COMPLEX': 0.1,
      'EXPERT': 0.15
    };
    return penalties[complexity] || 0;
  }

  // =====================================================
  // PUBLIC API METHODS
  // =====================================================

  /**
   * Route a service request to the best matching providers
   */
  async routeServiceRequest(
    categoryId: string,
    requirements: ServiceRequirements,
    constraints: ServiceConstraints,
    preferences: ServicePreferences,
    agencyId: string,
    requesterId: string
  ): Promise<ProviderMatch[]> {
    const request: ServiceMatchingRequest = {
      serviceRequestId: `req_${Date.now()}`,
      categoryId,
      requirements,
      constraints,
      preferences,
      agencyId,
      requesterId
    };

    return this.findMatchingProviders(request);
  }

  /**
   * Get provider performance analytics
   */
  async getProviderAnalytics(providerId: string, timeframe: { start: Date; end: Date }): Promise<Record<string, any>> {
    const provider = this.providerCache.get(providerId);
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    // In a real implementation, this would query historical data
    return {
      totalRequests: provider.performance.totalJobs,
      completionRate: provider.performance.completedJobs / provider.performance.totalJobs,
      averageQuality: provider.performance.qualityScore,
      averageRating: provider.performance.averageRating,
      responseTime: provider.availability.responseTime,
      revenueGenerated: provider.performance.totalJobs * provider.pricing.hourlyRate * 8, // Estimated
      clientSatisfaction: provider.performance.averageRating / 5
    };
  }

  /**
   * Update provider availability
   */
  async updateProviderAvailability(
    providerId: string,
    availability: Partial<ProviderAvailability>
  ): Promise<ServiceProvider> {
    const provider = this.providerCache.get(providerId);
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    provider.availability = { ...provider.availability, ...availability };
    this.providerCache.set(providerId, provider);

    this.logger.log(`Updated availability for provider: ${providerId}`);

    return provider;
  }

  /**
   * Add provider review and update performance metrics
   */
  async addProviderReview(
    providerId: string,
    review: Omit<ProviderReview, 'createdAt'>
  ): Promise<void> {
    const provider = this.providerCache.get(providerId);
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    const fullReview: ProviderReview = {
      ...review,
      createdAt: new Date()
    };

    provider.performance.recentReviews.unshift(fullReview);
    if (provider.performance.recentReviews.length > 10) {
      provider.performance.recentReviews = provider.performance.recentReviews.slice(0, 10);
    }

    // Update aggregate metrics
    provider.performance.totalJobs += 1;
    provider.performance.completedJobs += 1;
    
    const allRatings = provider.performance.recentReviews.map(r => r.rating);
    provider.performance.averageRating = allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length;
    
    const allQualityScores = provider.performance.recentReviews.map(r => r.qualityScore);
    provider.performance.qualityScore = allQualityScores.reduce((sum, score) => sum + score, 0) / allQualityScores.length;

    provider.performance.lastUpdated = new Date();

    this.providerCache.set(providerId, provider);

    this.logger.log(`Added review for provider: ${providerId}, new rating: ${provider.performance.averageRating}`);
  }
}
