import { Injectable } from '@nestjs/common';
  HUMAN = 'human'';
  AI_AGENT = 'ai_agent'';
  UNKNOWN = '';
    this.logger.debug('')
    if (signals.headers?.['
        signals.headers?.['
    if (signals.authMethod === '';
    if (signals.authMethod === oauth';
        signals.authMethod === password';
        signals.userAgent?.includes('')
      if (requestFrequency === high' && requestVariability === '';
      if (requestFrequency !== high' && requestVariability === '';
    if (interaction.requestStructure === 'complex'';
    } else if (interaction.requestStructure === 'medium'';
    if (avgTimeGapMs < 1000) return very_high'
    if (avgTimeGapMs < 5000) return high'
    if (avgTimeGapMs < 30000) return medium'
    if (avgTimeGapMs < 300000) return low'
    return very_low'
    if (coefficientOfVariation < 0.1) return very_low'
    if (coefficientOfVariation < 0.3) return low'
    if (coefficientOfVariation < 0.7) return medium'
    if (coefficientOfVariation < 1.0) return high'
    return very_high'
    if (complexityScore < 2) return very_low'
    if (complexityScore < 5) return low'
    if (complexityScore < 10) return medium'
    if (complexityScore < 20) return high'
  authMethod?:api_key' | oauth' | password'
  requestStructure: 'simple' | 'medium' | '
export type FrequencyCategory = very_low' | low' | 'medium' | high' | very_high';
export type VariabilityCategory = very_low' | low' | 'medium' | high' | very_high';
export type ComplexityCategory = very_low' | low' | 'medium' | high' | very_high';