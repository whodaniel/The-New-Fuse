import React, { useState, useEffect } from 'react';
import { 
  Agent, 
  AgentCapability, 
  AgentProtocol, 
  AgentTrustLevel,
  SummarizationLevel,
  SummarizationStyle,
  ContentPriority
} from '../types/agent-protocols.js';

interface AISummarizationAgentProps {
  id: string;
  name?: string;
  description?: string;
  onSummaryComplete?: (summary: string) => void;
  onError?: (error: Error) => void;
  summaryLevel?: SummarizationLevel;
  summaryStyle?: SummarizationStyle;
  contentPriorities?: ContentPriority[];
  maxTokens?: number;
  inputContent?: string;
  sourceUrls?: string[];
  trustLevel?: AgentTrustLevel;
  protocols?: AgentProtocol[];
}

/**
 * AI Summarization Agent
 * 
 * A specialized agent that handles summarizing complex information from various sources
 * with configurable summarization parameters.
 */
const AISummarizationAgent: React.FC<AISummarizationAgentProps> = ({
  id,
  name = 'AI Summarization Agent',
  description = 'Specialized agent for summarizing content with configurable parameters',
  onSummaryComplete,
  onError,
  summaryLevel = SummarizationLevel.CONCISE,
  summaryStyle = SummarizationStyle.FACTUAL,
  contentPriorities = [ContentPriority.KEY_FINDINGS],
  maxTokens = 500,
  inputContent = '',
  sourceUrls = [],
  trustLevel = AgentTrustLevel.STANDARD,
  protocols = [AgentProtocol.REST, AgentProtocol.MCP]
}) => {
  const [summary, setSummary] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [agent, setAgent] = useState<Agent>({
    id,
    name,
    description,
    capabilities: [
      AgentCapability.SUMMARIZATION,
      AgentCapability.TEXT_GENERATION,
      AgentCapability.DATA_PROCESSING
    ],
    supportedProtocols: protocols,
    trustLevel,
    status: 'idle'
  });

  useEffect(() => {
    // Update agent state when props change
    setAgent({
      ...agent,
      name,
      description,
      supportedProtocols: protocols,
      trustLevel
    });
  }, [name, description, protocols, trustLevel]);

  useEffect(() => {
    // Automatically process content if provided on mount or when it changes
    if (inputContent || sourceUrls.length > 0) {
      processSummarization();
    }
  }, [inputContent, sourceUrls.join(',')]);

  const processSummarization = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setAgent({ ...agent, status: 'busy' });

      // Construct the summarization request
      const requestData = {
        content: inputContent,
        sources: sourceUrls,
        parameters: {
          level: summaryLevel,
          style: summaryStyle,
          priorities: contentPriorities,
          maxTokens
        }
      };

      // Use either the AI service or fetch API depending on environment
      let summarizedContent: string;
      
      if (typeof window !== 'undefined' && window.fetch) {
        // Frontend - use fetch API
        const response = await fetch('/api/summarize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });
        
        if (!response.ok) {
          throw new Error(`Summarization failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        summarizedContent = data.summary;
      } else {
        // Server-side - use direct AI service
        // This is a placeholder for server-side implementation
        summarizedContent = await mockSummarize(requestData);
      }

      setSummary(summarizedContent);
      setAgent({ ...agent, status: 'idle' });
      setIsProcessing(false);
      
      if (onSummaryComplete) {
        onSummaryComplete(summarizedContent);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setAgent({ ...agent, status: 'error' });
      setIsProcessing(false);
      
      if (onError) {
        onError(error);
      }
    }
  };

  // Mock summarization function for development
  const mockSummarize = async (request: any): Promise<string> => {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simple length adjustment based on summary level
    const lengthMultiplier = 
      request.parameters.level === SummarizationLevel.BRIEF ? 0.1 :
      request.parameters.level === SummarizationLevel.CONCISE ? 0.25 :
      request.parameters.level === SummarizationLevel.DETAILED ? 0.5 : 0.75;
    
    // Mock summary based on content or sources
    if (request.content) {
      const contentLength = request.content.length * lengthMultiplier;
      return request.content.substring(0, Math.min(contentLength, request.parameters.maxTokens * 4)) + 
        `... [Summary generated using ${request.parameters.style} style with focus on ${request.parameters.priorities.join(', ')}]`;
    } else if (request.sources && request.sources.length > 0) {
      return `Summary of content from ${request.sources.length} sources: ${request.sources.join(', ')}. ` +
        `This summary was generated at the ${request.parameters.level} level with a ${request.parameters.style} style, ` +
        `focusing on ${request.parameters.priorities.join(', ')}.`;
    } else {
      return 'No content or sources provided to summarize.';
    }
  };

  return (
    <div className="ai-summarization-agent">
      <div className="agent-header">
        <h3>{agent.name}</h3>
        <span className={`status-indicator ${agent.status}`}>{agent.status}</span>
      </div>
      
      {error && (
        <div className="error-message">
          Error: {error.message}
        </div>
      )}
      
      {isProcessing ? (
        <div className="processing-indicator">
          Processing content...
        </div>
      ) : summary ? (
        <div className="summary-result">
          <h4>Summary</h4>
          <div className="summary-content">{summary}</div>
          <div className="summary-meta">
            <span>Level: {summaryLevel}</span>
            <span>Style: {summaryStyle}</span>
            <span>Priorities: {contentPriorities.join(', ')}</span>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          {!inputContent && sourceUrls.length === 0 ? 
            'Provide content or sources to generate a summary.' : 
            'Ready to generate summary.'}
        </div>
      )}
      
      {/* Control panel - only show if not automatically processing */}
      {(!isProcessing && (!inputContent || sourceUrls.length === 0)) && (
        <div className="control-panel">
          <button 
            onClick={processSummarization}
            disabled={!inputContent && sourceUrls.length === 0}
          >
            Generate Summary
          </button>
        </div>
      )}
    </div>
  );
};

export default AISummarizationAgent;