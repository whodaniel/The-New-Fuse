import React, { useState, useEffect, useCallback } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { AlertCircle, Newspaper, RefreshCw, Network, Link2 } from "lucide-react";
import { Toast } from '../../../packages/ui-components/src/core/toast.js';
import { 
  AgentCapability, 
  AgentProtocol, 
  AgentTrustLevel 
} from '../../../packages/core/types/src/agent.js';
import { AINewsAgentNodeData, NewsItem } from './types.js';
import { newsService } from './newsService.js';

/**
 * AI News Agent Node Component
 * 
 * An agent node for collecting and processing AI news from various sources.
 * Supports multiple agent protocols including A2A and MCP.
 */
const AINewsAgentNode: React.FC<NodeProps<AINewsAgentNodeData>> = ({ 
  data, 
  isConnectable,
  selected
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeProtocol, setActiveProtocol] = useState<AgentProtocol>(AgentProtocol.A2A);
  
  // Register agent with the system when component mounts
  useEffect(() => {
    const registerAgent = async () => {
      try {
        // Use the agent registration system from The New Fuse
        const result = await window.vscode?.commands.executeCommand(
          'thefuse.orchestrator.register',
          {
            id: data.id,
            name: data.name,
            capabilities: [
              AgentCapability.WEB_BROWSING,
              AgentCapability.WEB_SEARCH,
              AgentCapability.API_INTEGRATION,
              AgentCapability.TASK_EXECUTION,
              AgentCapability.DATA_PROCESSING
            ],
            protocols: data.supportedProtocols,
            version: '1.0.0',
            apiVersion: '1.0',
            trustLevel: AgentTrustLevel.VERIFIED,
            metadata: {
              category: 'news-collection',
              keywords: data.keywords,
              sources: data.sources,
              lastUpdated: data.lastUpdated,
              updateFrequency: data.updateFrequency
            }
          }
        );
        console.log("Agent registered:", result);
        
        // Subscribe to protocol switch requests
        const protocolSubscription = window.vscode?.commands.executeCommand(
          'thefuse.orchestrator.subscribe',
          {
            recipient: data.id,
            action: 'protocol.switch',
            callback: (message: any) => {
              if (message.protocol && Object.values(AgentProtocol).includes(message.protocol)) {
                setActiveProtocol(message.protocol);
                console.log(`Switched to ${message.protocol} protocol`);
              }
            }
          }
        );
        
        console.log("Protocol subscription registered:", protocolSubscription);
      } catch (err) {
        console.error("Failed to register agent:", err);
        setError("Failed to register agent");
      }
    };
    
    registerAgent();
    
    // Set up automatic updates
    const interval = setInterval(() => {
      if (data.updateFrequency > 0) {
        const lastUpdate = data.lastUpdated ? new Date(data.lastUpdated) : null;
        const now = new Date();
        if (!lastUpdate || 
            (now.getTime() - lastUpdate.getTime()) / 3600000 >= data.updateFrequency) {
          fetchLatestNews();
        }
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [data.id, data.name, data.updateFrequency, data.lastUpdated, data.supportedProtocols]);
  
  // Fetch latest AI news
  const fetchLatestNews = useCallback(async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      // Update status
      data.status = 'busy';
      
      // Fetch news from service
      const newItems = await newsService.fetchLatestNews({
        sources: data.sources,
        keywords: data.keywords,
        maxItems: data.maxItems,
        since: data.lastUpdated
      });
      
      // Update node data
      data.newsItems = [...newItems, ...data.newsItems].slice(0, data.maxItems);
      data.lastUpdated = new Date().toISOString();
      data.status = 'idle';
      
      // Broadcast the new data to other agents using the active protocol
      await broadcastNewsUpdate(newItems);
      
    } catch (err) {
      console.error("Error fetching news:", err);
      setError("Failed to fetch latest news");
      data.status = 'error';
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, data, activeProtocol]);
  
  // Broadcast news updates using the appropriate protocol
  const broadcastNewsUpdate = async (newItems: NewsItem[]) => {
    try {
      switch (activeProtocol) {
        case AgentProtocol.A2A:
          // Use A2A protocol
          await window.vscode?.commands.executeCommand(
            'thefuse.orchestrator.sendMessage',
            {
              sender: data.id,
              recipient: '*',
              action: 'news.update',
              payload: {
                newsItems: newItems,
                timestamp: new Date().toISOString(),
                protocol: AgentProtocol.A2A
              }
            }
          );
          break;
          
        case AgentProtocol.MCP:
          // Use Model Context Protocol
          await window.vscode?.commands.executeCommand(
            'thefuse.mcp.sendMessage',
            {
              sender: data.id,
              action: 'news.update',
              contextItems: newItems.map(item => ({
                type: 'news_item',
                content: {
                  title: item.title,
                  source: item.source,
                  url: item.url,
                  summary: item.summary,
                  date: item.date,
                  sentiment: item.sentiment,
                  keywords: item.keywords
                }
              })),
              metadata: {
                timestamp: new Date().toISOString(),
                protocol: AgentProtocol.MCP
              }
            }
          );
          break;
          
        default:
          console.warn(`Unsupported protocol: ${activeProtocol}`);
      }
    } catch (err) {
      console.error(`Error broadcasting via ${activeProtocol}:`, err);
    }
  };
  
  return (
    <div className={`p-4 rounded-md bg-white dark:bg-gray-800 border ${
      selected ? 'border-blue-500 shadow-lg' : 'border-gray-300 dark:border-gray-600'
    } transition-all duration-200 w-[300px]`}>
      {/* Input handle at top */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500"
      />
      
      {/* Node header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-blue-500" />
          <h3 className="font-medium text-sm">{data.name}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={fetchLatestNews}
            disabled={isUpdating}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Refresh news"
          >
            <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin text-blue-500' : 'text-gray-500'}`} />
          </button>
        </div>
      </div>
      
      {/* Protocol indicator */}
      <div className="flex items-center gap-1 mb-3 text-xs">
        <Network className="h-3 w-3 text-gray-500" />
        <span className="text-gray-500">Protocol:</span>
        <Badge 
          variant="outline" 
          className={`px-1 py-0 text-xs ${
            activeProtocol === AgentProtocol.A2A 
              ? 'bg-green-50 text-green-700' 
              : 'bg-purple-50 text-purple-700'
          }`}
        >
          {activeProtocol}
        </Badge>
      </div>
      
      {/* Status indicator */}
      {data.status === 'busy' && (
        <Toast
          variant="info"
          title="Fetching latest AI news"
          description="Please wait while we collect and process updates..."
          className="mb-3 py-2"
        />
      )}
      
      {data.status === 'error' && (
        <Toast
          variant="destructive"
          title="Error fetching news"
          description={error || "An unknown error occurred"}
          className="mb-3 py-2"
        />
      )}
      
      {/* Configuration summary */}
      <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex flex-wrap gap-1 mb-1">
          {data.sources.map(source => (
            <span key={source} className="px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700">
              {source}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {data.keywords.map(keyword => (
            <span key={keyword} className="px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
              {keyword}
            </span>
          ))}
        </div>
      </div>
      
      {/* News items preview */}
      <div className="max-h-[200px] overflow-y-auto border-t border-gray-200 dark:border-gray-700 pt-2">
        {data.newsItems.length > 0 ? (
          data.newsItems.slice(0, 3).map(item => (
            <div key={item.id} className="mb-2 text-xs">
              <div className="font-medium">{item.title}</div>
              <div className="text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                <span>{item.source}</span>
                <span>•</span>
                <span>{new Date(item.date).toLocaleDateString()}</span>
                {item.sentiment && (
                  <Badge variant="outline" className={`ml-1 py-0 px-1 text-[10px] ${
                    item.sentiment === 'positive' ? 'bg-green-50 text-green-700' : 
                    item.sentiment === 'negative' ? 'bg-red-50 text-red-700' : 
                    'bg-gray-50 text-gray-700'
                  }`}>
                    {item.sentiment}
                  </Badge>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-gray-400 dark:text-gray-500">
            <AlertCircle className="h-5 w-5 mb-1" />
            <span className="text-xs">No news collected yet</span>
          </div>
        )}
        
        {data.newsItems.length > 3 && (
          <div className="text-xs text-center text-blue-500 cursor-pointer hover:underline">
            +{data.newsItems.length - 3} more items
          </div>
        )}
      </div>
      
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

export default AINewsAgentNode;