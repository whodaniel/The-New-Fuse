import { Injectable } from '@nestjs/common';

export enum UserType {
  HUMAN = 'human',
  AI_AGENT = 'ai_agent',
  UNKNOWN = 'unknown'
}

export type FrequencyCategory = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
export type VariabilityCategory = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
export type ComplexityCategory = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export interface UserSignals {
  headers?: Record<string, string>;
  userAgent?: string;
  authMethod?: 'api_key' | 'oauth' | 'password';
  requestStructure: 'simple' | 'medium' | 'complex';
  requestFrequency: FrequencyCategory;
  requestVariability: VariabilityCategory;
  complexity: ComplexityCategory;
}

@Injectable()
export class UserTypeDetectionService {
  
  detectUserType(signals: UserSignals): UserType {
    // Check for obvious AI agent indicators
    if (signals.headers?.['x-agent-type'] === 'ai' || 
        signals.headers?.['user-agent']?.includes('bot')) {
      return UserType.AI_AGENT;
    }

    // Check auth method patterns
    if (signals.authMethod === 'api_key') {
      return UserType.AI_AGENT;
    }
    
    if (signals.authMethod === 'oauth' || 
        signals.authMethod === 'password') {
      
      if (signals.userAgent?.includes('Mozilla')) {
        // Analyze request patterns
        const requestFrequency = signals.requestFrequency;
        const requestVariability = signals.requestVariability;
        
        if (requestFrequency === 'high' && requestVariability === 'very_low') {
          return UserType.AI_AGENT;
        }
        
        if (requestFrequency !== 'high' && requestVariability === 'high') {
          return UserType.HUMAN;
        }
      }
    }

    // Check request complexity
    if (signals.requestStructure === 'complex') {
      return UserType.AI_AGENT;
    } else if (signals.requestStructure === 'medium') {
      return UserType.HUMAN;
    }

    return UserType.UNKNOWN;
  }

  private calculateRequestFrequency(timestamps: number[]): FrequencyCategory {
    if (timestamps.length < 2) return 'very_low';
    
    const gaps = timestamps.slice(1).map((ts, i) => ts - timestamps[i]);
    const avgTimeGapMs = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
    
    if (avgTimeGapMs < 1000) return 'very_high';
    if (avgTimeGapMs < 5000) return 'high';
    if (avgTimeGapMs < 30000) return 'medium';
    if (avgTimeGapMs < 300000) return 'low';
    return 'very_low';
  }

  private calculateRequestVariability(timestamps: number[]): VariabilityCategory {
    if (timestamps.length < 3) return 'very_low';
    
    const gaps = timestamps.slice(1).map((ts, i) => ts - timestamps[i]);
    const mean = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
    const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - mean, 2), 0) / gaps.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / mean;
    
    if (coefficientOfVariation < 0.1) return 'very_low';
    if (coefficientOfVariation < 0.3) return 'low';
    if (coefficientOfVariation < 0.7) return 'medium';
    if (coefficientOfVariation < 1.0) return 'high';
    return 'very_high';
  }

  private calculateComplexity(request: any): ComplexityCategory {
    let complexityScore = 0;
    
    // Add complexity based on request structure
    if (request.params) complexityScore += Object.keys(request.params).length;
    if (request.body) complexityScore += JSON.stringify(request.body).length / 100;
    if (request.query) complexityScore += Object.keys(request.query).length;
    
    if (complexityScore < 2) return 'very_low';
    if (complexityScore < 5) return 'low';
    if (complexityScore < 10) return 'medium';
    if (complexityScore < 20) return 'high';
    return 'very_high';
  }
}