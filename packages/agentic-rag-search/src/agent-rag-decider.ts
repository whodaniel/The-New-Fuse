/**
 * Agent RAG Decision Maker
 * 
 * Determines whether to invoke search tool based on user message analysis.
 * Implements conditional retrieval logic for agentic RAG pattern.
 */

import { Logger } from '@the-new-fuse/logger';

const logger = new Logger({ service: 'agent-rag-decider' });

export interface RAGDecision {
  shouldSearch: boolean;
  confidence: number;
  rewrittenQuery?: string;
  reason: string;
  requiresAdditionalRounds?: boolean;
}

export interface RAGDeciderConfig {
  llmProvider: unknown; // LLM provider for decision making
  searchThreshold: number; // Confidence threshold for triggering search
}

export class AgentRAGDecider {
  private config: RAGDeciderConfig;

  constructor(config: RAGDeciderConfig) {
    this.config = config;
  }

  async decide(userMessage: string, conversationContext?: string[]): Promise<RAGDecision> {
    logger.info('Evaluating RAG necessity', {
      messageLength: userMessage.length,
      contextLength: conversationContext?.length ?? 0,
    });

    // Decision logic based on message characteristics
    const searchIndicators = {
      hasQuestion: /[?]/.test(userMessage),
      hasKnowledgeRequest: /(explain|describe|what is|how does|tell me about)/i.test(userMessage),
      hasSpecificTopic: userMessage.length > 20,
      hasContextReference: /(above|previous|mentioned|earlier)/i.test(userMessage),
    };

    const indicatorCount = Object.values(searchIndicators).filter(Boolean).length;
    const confidence = indicatorCount / Object.keys(searchIndicators).length;

    const shouldSearch = confidence >= this.config.searchThreshold;

    const decision: RAGDecision = {
      shouldSearch,
      confidence,
      reason: this.generateReason(searchIndicators, shouldSearch),
      requiresAdditionalRounds: shouldSearch && confidence < 0.9,
    };

    if (shouldSearch) {
      decision.rewrittenQuery = this.rewriteQuery(userMessage);
    }

    logger.info('RAG decision made', {
      shouldSearch,
      confidence,
      reason: decision.reason,
    });

    return decision;
  }

  private generateReason(indicators: Record<string, boolean>, shouldSearch: boolean): string {
    const activeIndicators = Object.entries(indicators)
      .filter(([, value]) => value)
      .map(([key]) => key);

    if (shouldSearch) {
      return `Search triggered by indicators: ${activeIndicators.join(', ')}`;
    }
    return `Search not needed: insufficient indicators (${activeIndicators.length}/${Object.keys(indicators).length})`;
  }

  private rewriteQuery(originalQuery: string): string {
    // Simple query normalization - would use LLM in production
    return originalQuery
      .trim()
      .replace(/^(can you|please|i need|tell me)\s+/i, '')
      .replace(/\?$/, '');
  }
}

export function createAgentRAGDecider(config: RAGDeciderConfig): AgentRAGDecider {
  return new AgentRAGDecider(config);
}
