import React, { useState, useEffect, useCallback } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { 
  FileText, 
  ListFilter, 
  Settings, 
  MessageSquare, 
  Paperclip,
  BarChart,
  FileDigit,
  CheckSquare,
  BookOpen,
  Scroll
} from "lucide-react";
import { Toast } from '../../../packages/ui-components/src/core/toast.js';
import { Progress } from '../../../packages/ui-components/src/core/progress.js';
import { Badge } from '../../../packages/ui-components/src/core/badge.js';
import { 
  AgentCapability, 
  AgentProtocol, 
  AgentTrustLevel,
  SummarizationLevel,
  SummarizationStyle,
  ContentPriority
} from '../../../types/agent-protocols.js';

/**
 * Summary Item Interface
 */
export interface SummaryItem {
  id: string;
  title: string;
  originalText: string;
  summarizedText: string;
  summaryLevel: SummarizationLevel;
  summaryStyle: SummarizationStyle;
  contentPriorities: ContentPriority[];
  characterCount: {
    original: number;
    summarized: number;
  };
  wordCount: {
    original: number;
    summarized: number;
  };
  compressionRatio: number;
  createdAt: string;
  updatedAt: string;
  metadata: {
    source?: string;
    author?: string;
    tags?: string[];
    [key: string]: any;
  };
  keyInsights?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
}

/**
 * AI Summarization Agent Node Data Interface
 */
export interface AISummarizationAgentNodeData {
  id: string;
  name: string;
  defaultSummaryLevel: SummarizationLevel;
  defaultSummaryStyle: SummarizationStyle;
  defaultContentPriorities: ContentPriority[];
  summaries: SummaryItem[];
  status: 'idle' | 'busy' | 'error';
  lastUpdated: string | null;
  supportedProtocols: AgentProtocol[];
  maxSummaryLength: number;
  minCompressionRatio: number;
  preserveKeyConcepts: boolean;
  retainedSummaryCount: number;
  autoSummarize: boolean;
  currentContent?: string;
  currentResult?: string;
  maintainKeyTerms?: string[];
}

/**
 * Default AI Summarization Agent Node Data
 */
export const defaultAISummarizationAgentData: AISummarizationAgentNodeData = {
  id: crypto.randomUUID(),
  name: "Summarization Agent",
  defaultSummaryLevel: SummarizationLevel.CONCISE,
  defaultSummaryStyle: SummarizationStyle.FACTUAL,
  defaultContentPriorities: [ContentPriority.KEY_FINDINGS, ContentPriority.CONCEPTS],
  summaries: [],
  status: 'idle',
  lastUpdated: null,
  supportedProtocols: [AgentProtocol.A2A, AgentProtocol.MCP],
  maxSummaryLength: 2000,
  minCompressionRatio: 0.3, // Aim for at least 70% reduction
  preserveKeyConcepts: true,
  retainedSummaryCount: 10,
  autoSummarize: true,
  maintainKeyTerms: []
};

/**
 * Calculate statistics for a piece of text
 */
const calculateTextStats = (text: string) => {
  const characterCount = text.length;
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  
  return {
    characterCount,
    wordCount
  };
};

/**
 * Calculate compression ratio between original and summarized text
 */
const calculateCompressionRatio = (original: string, summarized: string) => {
  if (!original.length) return 0;
  
  return summarized.length / original.length;
};

/**
 * AI Summarization Agent Node Component
 * 
 * Specialized agent for summarizing content with configurable parameters
 */
const AISummarizationAgent: React.FC<NodeProps<AISummarizationAgentNodeData>> = ({ 
  data, 
  isConnectable,
  selected
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [activeSummaryLevel, setActiveSummaryLevel] = useState<SummarizationLevel>(data.defaultSummaryLevel);
  const [activeSummaryStyle, setActiveSummaryStyle] = useState<SummarizationStyle>(data.defaultSummaryStyle);
  const [activeContentPriorities, setActiveContentPriorities] = useState<ContentPriority[]>(data.defaultContentPriorities);
  
  // Initialize agent on mount
  useEffect(() => {
    initializeAgent();
  }, []);
  
  // Initialize the summarization agent
  const initializeAgent = async () => {
    try {
      data.status = 'busy';
      
      // Use VS Code extension API to initialize the agent
      const result = await window.vscode?.commands.executeCommand(
        'thefuse.summarization.initialize',
        {
          id: data.id,
          name: data.name,
          supportedProtocols: data.supportedProtocols,
          capabilities: [
            AgentCapability.SUMMARIZATION,
            AgentCapability.INFORMATION_RETRIEVAL,
            AgentCapability.DATA_PROCESSING,
            AgentCapability.REASONING
          ],
          defaultSummaryLevel: data.defaultSummaryLevel,
          defaultSummaryStyle: data.defaultSummaryStyle,
          defaultContentPriorities: data.defaultContentPriorities,
          maxSummaryLength: data.maxSummaryLength,
          minCompressionRatio: data.minCompressionRatio,
          preserveKeyConcepts: data.preserveKeyConcepts,
          maintainKeyTerms: data.maintainKeyTerms
        }
      );
      
      if (result?.summaries) {
        // Initialize with existing summaries
        data.summaries = result.summaries;
      }
      
      data.lastUpdated = new Date().toISOString();
      data.status = 'idle';
      
      // Subscribe to summarization requests
      await window.vscode?.commands.executeCommand(
        'thefuse.orchestrator.subscribe',
        {
          recipient: data.id,
          action: 'summarization.request',
          callback: (message: any) => {
            if (message.content) {
              handleNewContent(
                message.content, 
                message.title || 'Untitled',
                message.metadata || {},
                message.summaryLevel,
                message.summaryStyle,
                message.contentPriorities
              );
            }
          }
        }
      );
      
    } catch (err) {
      console.error("Failed to initialize summarization agent:", err);
      setError("Failed to initialize summarization agent");
      data.status = 'error';
    }
  };
  
  // Handle new content for summarization
  const handleNewContent = (
    content: string, 
    title: string = 'Untitled',
    metadata: Record<string, any> = {},
    summaryLevel: SummarizationLevel = data.defaultSummaryLevel,
    summaryStyle: SummarizationStyle = data.defaultSummaryStyle,
    contentPriorities: ContentPriority[] = data.defaultContentPriorities
  ) => {
    data.currentContent = content;
    
    if (data.autoSummarize && data.status === 'idle') {
      summarizeContent(
        content, 
        title, 
        metadata, 
        summaryLevel, 
        summaryStyle, 
        contentPriorities
      );
    }
  };
  
  // Summarize content with given parameters
  const summarizeContent = async (
    content: string, 
    title: string = 'Untitled',
    metadata: Record<string, any> = {},
    summaryLevel: SummarizationLevel = activeSummaryLevel,
    summaryStyle: SummarizationStyle = activeSummaryStyle,
    contentPriorities: ContentPriority[] = activeContentPriorities
  ) => {
    if (isProcessing || data.status === 'busy') return;
    
    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);
    data.status = 'busy';
    
    try {
      // Set up progress tracking
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          const newProgress = prev + Math.random() * 5;
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 200);
      
      // Use VS Code extension API to perform summarization
      const result = await window.vscode?.commands.executeCommand(
        'thefuse.summarization.summarize',
        {
          agentId: data.id,
          content,
          title,
          metadata,
          summaryLevel,
          summaryStyle,
          contentPriorities,
          maxLength: data.maxSummaryLength,
          minCompressionRatio: data.minCompressionRatio,
          preserveKeyConcepts: data.preserveKeyConcepts,
          maintainKeyTerms: data.maintainKeyTerms
        }
      );
      
      clearInterval(progressInterval);
      setProcessingProgress(100);
      
      if (result?.summary) {
        const originalStats = calculateTextStats(content);
        const summaryStats = calculateTextStats(result.summary);
        
        const compressionRatio = calculateCompressionRatio(content, result.summary);
        
        // Create summary item
        const summaryItem: SummaryItem = {
          id: crypto.randomUUID(),
          title,
          originalText: content,
          summarizedText: result.summary,
          summaryLevel,
          summaryStyle,
          contentPriorities,
          characterCount: {
            original: originalStats.characterCount,
            summarized: summaryStats.characterCount
          },
          wordCount: {
            original: originalStats.wordCount,
            summarized: summaryStats.wordCount
          },
          compressionRatio,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata,
          keyInsights: result.keyInsights,
          sentiment: result.sentiment
        };
        
        // Add to summaries
        data.summaries.push(summaryItem);
        
        // Limit to retained summary count
        if (data.summaries.length > data.retainedSummaryCount) {
          data.summaries.shift();
        }
        
        // Store current result
        data.currentResult = result.summary;
        
        // Broadcast result
        await window.vscode?.commands.executeCommand(
          'thefuse.orchestrator.sendMessage',
          {
            sender: data.id,
            action: 'summarization.result',
            payload: {
              summary: summaryItem,
              timestamp: new Date().toISOString()
            }
          }
        );
      }
      
      data.lastUpdated = new Date().toISOString();
      data.status = 'idle';
      
      // Brief delay before resetting UI
      setTimeout(() => {
        setProcessingProgress(0);
      }, 1000);
      
    } catch (err) {
      console.error("Error summarizing content:", err);
      setError("Failed to summarize content");
      data.status = 'error';
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Change summary level
  const changeSummaryLevel = async (level: SummarizationLevel) => {
    try {
      const result = await window.vscode?.commands.executeCommand(
        'thefuse.summarization.setLevel',
        {
          agentId: data.id,
          level
        }
      );
      
      if (result?.success) {
        setActiveSummaryLevel(level);
        data.defaultSummaryLevel = level;
        data.lastUpdated = new Date().toISOString();
      }
    } catch (err) {
      console.error("Error changing summarization level:", err);
      setError("Failed to change summarization level");
    }
  };
  
  // Change summary style
  const changeSummaryStyle = async (style: SummarizationStyle) => {
    try {
      const result = await window.vscode?.commands.executeCommand(
        'thefuse.summarization.setStyle',
        {
          agentId: data.id,
          style
        }
      );
      
      if (result?.success) {
        setActiveSummaryStyle(style);
        data.defaultSummaryStyle = style;
        data.lastUpdated = new Date().toISOString();
      }
    } catch (err) {
      console.error("Error changing summarization style:", err);
      setError("Failed to change summarization style");
    }
  };
  
  // Toggle content priority
  const toggleContentPriority = async (priority: ContentPriority) => {
    try {
      const newPriorities = activeContentPriorities.includes(priority)
        ? activeContentPriorities.filter(p => p !== priority)
        : [...activeContentPriorities, priority];
      
      // Ensure at least one priority is selected
      if (newPriorities.length === 0) {
        return;
      }
      
      const result = await window.vscode?.commands.executeCommand(
        'thefuse.summarization.setPriorities',
        {
          agentId: data.id,
          priorities: newPriorities
        }
      );
      
      if (result?.success) {
        setActiveContentPriorities(newPriorities);
        data.defaultContentPriorities = newPriorities;
        data.lastUpdated = new Date().toISOString();
      }
    } catch (err) {
      console.error("Error changing content priorities:", err);
      setError("Failed to change content priorities");
    }
  };
  
  // Process input data from connected nodes
  const processInput = async (input: any) => {
    if (typeof input === 'string') {
      handleNewContent(input, 'Input from workflow');
    } else if (typeof input === 'object') {
      if (input.content) {
        handleNewContent(
          input.content,
          input.title || 'Input from workflow',
          input.metadata || {},
          input.summaryLevel,
          input.summaryStyle,
          input.contentPriorities
        );
      }
    }
  };
  
  // Handle new data coming in via the input handle
  useEffect(() => {
    const handleData = (event: any) => {
      if (event.target && event.target.nodeid === data.id && event.data) {
        processInput(event.data);
      }
    };
    
    // Listen for data events
    document.addEventListener('nodedata', handleData);
    
    return () => {
      document.removeEventListener('nodedata', handleData);
    };
  }, [data.id]);
  
  // Format content priority for display
  const formatContentPriority = (priority: ContentPriority) => {
    return priority.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  return (
    <div className={`p-4 rounded-md bg-white dark:bg-gray-800 border ${
      selected ? 'border-blue-500 shadow-lg' : 'border-gray-300 dark:border-gray-600'
    } transition-all duration-200 w-[340px]`}>
      {/* Input handle at top */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500"
      />
      
      {/* Node header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-500" />
          <h3 className="font-medium text-sm">{data.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
            {data.defaultSummaryLevel}
          </Badge>
        </div>
      </div>
      
      {/* Status indicator */}
      {data.status === 'busy' && isProcessing && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              <span>Summarizing content</span>
            </div>
            <div className="text-xs text-gray-500">{processingProgress.toFixed(0)}%</div>
          </div>
          <Progress value={processingProgress} className="h-1.5" />
        </div>
      )}
      
      {data.status === 'error' && (
        <Toast
          variant="destructive"
          title="Summarization error"
          description={error || "An unknown error occurred"}
          className="mb-3 py-2"
        />
      )}
      
      {/* Summarization levels */}
      <div className="mb-4">
        <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
          <Settings className="h-3.5 w-3.5" />
          <span>Summarization Level</span>
        </h4>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {Object.values(SummarizationLevel).map(level => (
            <button
              key={level}
              onClick={() => changeSummaryLevel(level)}
              className={`px-2 py-1 rounded text-xs ${
                activeSummaryLevel === level
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 font-medium'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
      
      {/* Summarization styles */}
      <div className="mb-4">
        <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
          <FileDigit className="h-3.5 w-3.5" />
          <span>Summarization Style</span>
        </h4>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {Object.values(SummarizationStyle).map(style => (
            <button
              key={style}
              onClick={() => changeSummaryStyle(style)}
              className={`px-2 py-1 rounded text-xs ${
                activeSummaryStyle === style
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 font-medium'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {style.split('-').join(' ')}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content priorities */}
      <div className="mb-4">
        <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
          <ListFilter className="h-3.5 w-3.5" />
          <span>Content Priorities</span>
        </h4>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {Object.values(ContentPriority).map(priority => (
            <button
              key={priority}
              onClick={() => toggleContentPriority(priority)}
              className={`px-2 py-1 rounded text-xs ${
                activeContentPriorities.includes(priority)
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 font-medium'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {formatContentPriority(priority)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Recent summaries */}
      <div className="mb-4">
        <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
          <Scroll className="h-3.5 w-3.5" />
          <span>Recent Summaries</span>
        </h4>
        
        <div className="max-h-[200px] overflow-y-auto space-y-1.5">
          {data.summaries.length > 0 ? (
            data.summaries.slice(-3).reverse().map(summary => (
              <div 
                key={summary.id} 
                className="text-xs border border-gray-100 dark:border-gray-700 rounded p-1.5"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium truncate max-w-[200px]">{summary.title}</span>
                  <div className="flex items-center gap-1">
                    <Badge className={`text-[10px] ${
                      summary.summaryLevel === SummarizationLevel.BRIEF
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : summary.summaryLevel === SummarizationLevel.CONCISE
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : summary.summaryLevel === SummarizationLevel.DETAILED
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
                    }`}>
                      {summary.summaryLevel}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {summary.summaryStyle.split('-').join(' ')}
                    </Badge>
                  </div>
                </div>
                
                <div className="text-gray-700 dark:text-gray-300 mb-1">
                  {summary.summarizedText.substring(0, 100)}{summary.summarizedText.length > 100 ? '...' : ''}
                </div>
                
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <div className="flex items-center gap-1">
                    <span>{summary.wordCount.summarized} words</span>
                    <span>•</span>
                    <span>{(summary.compressionRatio * 100).toFixed(0)}% of original</span>
                  </div>
                  <div>
                    {new Date(summary.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                {/* Key insights */}
                {summary.keyInsights && summary.keyInsights.length > 0 && (
                  <div className="mt-1 pt-1 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-[10px] mb-1">
                      <CheckSquare className="h-3 w-3" />
                      <span>Key Insights:</span>
                    </div>
                    <div className="space-y-0.5">
                      {summary.keyInsights.slice(0, 2).map((insight, idx) => (
                        <div key={idx} className="text-[10px] text-gray-700 dark:text-gray-300">
                          • {insight.length > 60 ? insight.substring(0, 60) + '...' : insight}
                        </div>
                      ))}
                      {summary.keyInsights.length > 2 && (
                        <div className="text-[10px] text-gray-500">
                          +{summary.keyInsights.length - 2} more insights
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-gray-400 dark:text-gray-500">
              <BookOpen className="h-5 w-5 mb-1 opacity-20" />
              <span className="text-xs">No summaries yet</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Summary statistics */}
      {data.summaries.length > 0 && (
        <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-850 rounded text-xs border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
              <BarChart className="h-3.5 w-3.5 text-blue-500" />
              <span className="font-medium">Agent Statistics</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Summaries:</span>
              <span className="font-medium">{data.summaries.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Avg. Compression:</span>
              <span className="font-medium">
                {(data.summaries.reduce((acc, s) => acc + s.compressionRatio, 0) / data.summaries.length * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Avg. Word Count:</span>
              <span className="font-medium">
                {Math.round(data.summaries.reduce((acc, s) => acc + s.wordCount.summarized, 0) / data.summaries.length)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Words Saved:</span>
              <span className="font-medium">
                {data.summaries.reduce((acc, s) => acc + (s.wordCount.original - s.wordCount.summarized), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Manual summarize button */}
      {data.currentContent && !isProcessing && (
        <div className="mb-3">
          <button
            onClick={() => summarizeContent(data.currentContent!, 'Manual summarization')}
            className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 rounded text-xs font-medium transition-colors"
          >
            Summarize Current Content
          </button>
        </div>
      )}
      
      {/* Last updated */}
      {data.lastUpdated && (
        <div className="mt-2 text-xs text-gray-400 text-right">
          Last updated: {new Date(data.lastUpdated).toLocaleString()}
        </div>
      )}
      
      {/* Output handle at bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500"
      />
    </div>
  );
};

export default AISummarizationAgent;