/**
 * Types for the AI News Agent node
 */
import { AgentProtocol } from '../../../packages/core/types/src/agent.js';

// Define node data structure
export interface AINewsAgentNodeData {
  id: string;
  name: string;
  sources: string[];
  keywords: string[];
  updateFrequency: number; // hours
  lastUpdated: string | null;
  status: 'idle' | 'busy' | 'error';
  newsItems: NewsItem[];
  maxItems: number;
  supportedProtocols: AgentProtocol[];
  trustScore?: number;
  discoveryMechanism?: 'manual' | 'auto' | 'recommended';
  extensionPoints?: ExtensionPoint[];
}

// Define news item structure
export interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  summary: string;
  date: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  keywords?: string[];
  entityMentions?: EntityMention[];
  verification?: VerificationStatus;
}

// API request type
export interface NewsAPIRequest {
  sources: string[];
  keywords: string[];
  maxItems: number;
  since?: string; // ISO date string
  protocol?: AgentProtocol;
}

// Extension point for agent extensibility
export interface ExtensionPoint {
  id: string;
  name: string;
  description: string;
  interfaceSpec: string;
}

// Entity mention in news content
export interface EntityMention {
  entity: string;
  type: 'person' | 'organization' | 'technology' | 'product' | 'concept' | 'other';
  sentiment?: 'positive' | 'neutral' | 'negative';
}

// News verification status
export interface VerificationStatus {
  verified: boolean;
  verificationSource?: string;
  verificationDate?: string;
  confidenceScore?: number;
}

// Default node data
export const defaultNewsAgentData: AINewsAgentNodeData = {
  id: crypto.randomUUID(),
  name: "AI News Collector",
  sources: ["arxiv.org", "huggingface.co", "ai.googleblog.com"],
  keywords: ["LLM", "generative AI", "transformer"],
  updateFrequency: 24,
  lastUpdated: null,
  status: 'idle',
  newsItems: [],
  maxItems: 10,
  supportedProtocols: [AgentProtocol.A2A, AgentProtocol.MCP],
  trustScore: 0.9,
  discoveryMechanism: 'manual',
  extensionPoints: [
    {
      id: "news-processor",
      name: "News Processor",
      description: "Extension point for custom news processing logic",
      interfaceSpec: "function processNews(newsItems: NewsItem[]): NewsItem[]"
    },
    {
      id: "sentiment-analyzer",
      name: "Sentiment Analyzer",
      description: "Custom sentiment analysis for news items",
      interfaceSpec: "function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative'"
    }
  ]
};