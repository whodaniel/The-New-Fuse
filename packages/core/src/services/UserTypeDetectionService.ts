import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger.js';

/**
 * User types supported by the system
 */
export enum UserType {
  HUMAN = 'human',
  AI_AGENT = 'ai_agent',
  UNKNOWN = 'unknown'
}

/**
 * Service for detecting user types (human vs AI agent)
 */
@Injectable()
export class UserTypeDetectionService {
  private logger = new Logger(UserTypeDetectionService.name);

  /**
   * Detect user type based on request headers, behavior patterns, and other signals
   * @param signals Detection signals
   * @returns Detected user type
   */
  detectUserType(signals: UserTypeDetectionSignals): UserType {
    this.logger.debug('Detecting user type', { signals });

    // Check for explicit AI agent signals
    if (signals.headers?.['x-agent-id'] || 
        signals.headers?.['x-agent-type'] || 
        signals.headers?.['x-agent-capabilities']) {
      return UserType.AI_AGENT;
    }

    // Check for API key authentication (common for AI agents)
    if (signals.authMethod === 'api_key') {
      return UserType.AI_AGENT;
    }

    // Check for human signals
    if (signals.authMethod === 'oauth' || 
        signals.authMethod === 'password' ||
        signals.userAgent?.includes('Mozilla') ||
        signals.hasInteractiveSession) {
      return UserType.HUMAN;
    }

    // Check for communication patterns
    if (signals.communicationPatterns) {
      const { requestFrequency, requestVariability, interactionComplexity } = signals.communicationPatterns;
      
      // AI agents typically have high request frequency, low variability, and medium complexity
      if (requestFrequency === 'high' && requestVariability === 'low') {
        return UserType.AI_AGENT;
      }
      
      // Humans typically have low-medium request frequency, high variability, and high complexity
      if (requestFrequency !== 'high' && requestVariability === 'high') {
        return UserType.HUMAN;
      }
    }

    // Default to unknown if we can't determine
    return UserType.UNKNOWN;
  }

  /**
   * Analyze communication patterns to determine if user is human or AI
   * @param interactions Recent user interactions
   * @returns Communication pattern analysis
   */
  analyzeCommunicationPatterns(interactions: UserInteraction[]): CommunicationPatternAnalysis {
    if (interactions.length === 0) {
      return {
        requestFrequency: 'unknown',
        requestVariability: 'unknown',
        interactionComplexity: 'unknown'
      };
    }

    // Calculate request frequency
    const timeGaps = this.calculateTimeGaps(interactions);
    const avgTimeGap = timeGaps.reduce((sum, gap) => sum + gap, 0) / timeGaps.length;
    const requestFrequency = this.categorizeFrequency(avgTimeGap);

    // Calculate request variability
    const stdDevTimeGap = this.calculateStdDev(timeGaps);
    const requestVariability = this.categorizeVariability(stdDevTimeGap / avgTimeGap);

    // Calculate interaction complexity
    const complexityScores = interactions.map(i => this.calculateComplexity(i));
    const avgComplexity = complexityScores.reduce((sum, score) => sum + score, 0) / complexityScores.length;
    const interactionComplexity = this.categorizeComplexity(avgComplexity);

    return {
      requestFrequency,
      requestVariability,
      interactionComplexity
    };
  }

  private calculateTimeGaps(interactions: UserInteraction[]): number[] {
    const sortedInteractions = [...interactions].sort((a, b) => a.timestamp - b.timestamp);
    const gaps: number[] = [];
    
    for (let i = 1; i < sortedInteractions.length; i++) {
      gaps.push(sortedInteractions[i].timestamp - sortedInteractions[i-1].timestamp);
    }
    
    return gaps;
  }

  private calculateStdDev(values: number[]): number {
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map(val => Math.pow(val - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
  }

  private calculateComplexity(interaction: UserInteraction): number {
    // Simple complexity heuristic based on request size and structure
    let complexity = 0;
    
    // Add complexity for request size
    complexity += interaction.requestSize / 1000; // 1 point per KB
    
    // Add complexity for request structure
    if (interaction.requestStructure === 'complex') {
      complexity += 5;
    } else if (interaction.requestStructure === 'medium') {
      complexity += 3;
    } else {
      complexity += 1;
    }
    
    return complexity;
  }

  private categorizeFrequency(avgTimeGapMs: number): FrequencyCategory {
    if (avgTimeGapMs < 1000) return 'very_high';
    if (avgTimeGapMs < 5000) return 'high';
    if (avgTimeGapMs < 30000) return 'medium';
    if (avgTimeGapMs < 300000) return 'low';
    return 'very_low';
  }

  private categorizeVariability(coefficientOfVariation: number): VariabilityCategory {
    if (coefficientOfVariation < 0.1) return 'very_low';
    if (coefficientOfVariation < 0.3) return 'low';
    if (coefficientOfVariation < 0.7) return 'medium';
    if (coefficientOfVariation < 1.0) return 'high';
    return 'very_high';
  }

  private categorizeComplexity(complexityScore: number): ComplexityCategory {
    if (complexityScore < 2) return 'very_low';
    if (complexityScore < 5) return 'low';
    if (complexityScore < 10) return 'medium';
    if (complexityScore < 20) return 'high';
    return 'very_high';
  }
}

/**
 * Signals used for user type detection
 */
export interface UserTypeDetectionSignals {
  headers?: Record<string, string>;
  authMethod?: 'api_key' | 'oauth' | 'password' | 'none';
  userAgent?: string;
  hasInteractiveSession?: boolean;
  communicationPatterns?: CommunicationPatternAnalysis;
}

/**
 * User interaction data
 */
export interface UserInteraction {
  timestamp: number;
  requestSize: number;
  requestStructure: 'simple' | 'medium' | 'complex';
}

/**
 * Communication pattern analysis
 */
export interface CommunicationPatternAnalysis {
  requestFrequency: FrequencyCategory;
  requestVariability: VariabilityCategory;
  interactionComplexity: ComplexityCategory;
}

/**
 * Frequency categories
 */
export type FrequencyCategory = 'very_low' | 'low' | 'medium' | 'high' | 'very_high' | 'unknown';

/**
 * Variability categories
 */
export type VariabilityCategory = 'very_low' | 'low' | 'medium' | 'high' | 'very_high' | 'unknown';

/**
 * Complexity categories
 */
export type ComplexityCategory = 'very_low' | 'low' | 'medium' | 'high' | 'very_high' | 'unknown';
