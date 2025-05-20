import React, { useState, useEffect, useCallback } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Shield, 
  ServerCog, 
  Users 
} from "lucide-react";
import { Toast } from '../../../packages/ui-components/src/core/toast.js';
import { 
  AgentCapability, 
  AgentProtocol, 
  AgentTrustLevel 
} from '../../../packages/core/types/src/agent.js';

/**
 * Agent Registry Node Data Interface
 */
export interface AgentRegistryNodeData {
  id: string;
  name: string;
  registeredAgents: RegisteredAgent[];
  status: 'idle' | 'busy' | 'error';
  lastUpdated: string | null;
  trustThreshold: number;
  enableAutoDiscovery: boolean;
  enableCrossChainRegistry: boolean;
  scanInterval: number; // minutes
  supportedProtocols: AgentProtocol[];
}

/**
 * Registered Agent Interface
 */
export interface RegisteredAgent {
  id: string;
  name: string;
  capabilities: AgentCapability[];
  protocols: AgentProtocol[];
  version: string;
  apiVersion: string;
  trustLevel: AgentTrustLevel;
  trustScore: number;
  status: 'online' | 'offline' | 'degraded';
  lastSeen: string;
  metadata: Record<string, any>;
  verificationStatus: 'verified' | 'unverified' | 'pending';
  discoveryMethod: 'manual' | 'auto' | 'imported';
}

/**
 * Default Agent Registry Node Data
 */
export const defaultAgentRegistryData: AgentRegistryNodeData = {
  id: crypto.randomUUID(),
  name: "Agent Registry",
  registeredAgents: [],
  status: 'idle',
  lastUpdated: null,
  trustThreshold: 0.7,
  enableAutoDiscovery: true,
  enableCrossChainRegistry: false,
  scanInterval: 10, // minutes
  supportedProtocols: [AgentProtocol.A2A, AgentProtocol.MCP],
};

/**
 * Agent Registry Node Component
 * 
 * A centralized registry for discovering and managing agents in the workflow.
 * Provides security, governance, and coordination services for multi-agent systems.
 */
const AgentRegistryNode: React.FC<NodeProps<AgentRegistryNodeData>> = ({ 
  data, 
  isConnectable,
  selected
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredCount, setRegisteredCount] = useState(data.registeredAgents.length);
  const [onlineCount, setOnlineCount] = useState(0);
  
  // Initialize registry on mount
  useEffect(() => {
    initializeRegistry();
    
    // Set up scan interval
    const interval = setInterval(() => {
      if (data.enableAutoDiscovery) {
        scanForAgents();
      }
    }, data.scanInterval * 60 * 1000); // Convert minutes to milliseconds
    
    return () => clearInterval(interval);
  }, [data.scanInterval, data.enableAutoDiscovery]);
  
  // Update counts when registered agents change
  useEffect(() => {
    setRegisteredCount(data.registeredAgents.length);
    setOnlineCount(data.registeredAgents.filter(agent => agent.status === 'online').length);
  }, [data.registeredAgents]);
  
  // Initialize the agent registry
  const initializeRegistry = async () => {
    try {
      data.status = 'busy';
      
      // Use VS Code extension API to initialize the registry service
      const result = await window.vscode?.commands.executeCommand(
        'thefuse.registry.initialize',
        {
          id: data.id,
          name: data.name,
          supportedProtocols: data.supportedProtocols,
          trustThreshold: data.trustThreshold,
          enableAutoDiscovery: data.enableAutoDiscovery,
          enableCrossChainRegistry: data.enableCrossChainRegistry,
        }
      );
      
      if (result?.agents) {
        data.registeredAgents = result.agents;
        data.lastUpdated = new Date().toISOString();
      }
      
      data.status = 'idle';
      
      // Register messaging handlers for agent registration events
      await window.vscode?.commands.executeCommand(
        'thefuse.orchestrator.subscribe',
        {
          action: 'registry.agent.registered',
          callback: (message: any) => {
            handleAgentRegistered(message.agent);
          }
        }
      );
      
      await window.vscode?.commands.executeCommand(
        'thefuse.orchestrator.subscribe',
        {
          action: 'registry.agent.updated',
          callback: (message: any) => {
            handleAgentUpdated(message.agent);
          }
        }
      );
      
      await window.vscode?.commands.executeCommand(
        'thefuse.orchestrator.subscribe',
        {
          action: 'registry.agent.unregistered',
          callback: (message: any) => {
            handleAgentUnregistered(message.agentId);
          }
        }
      );
      
    } catch (err) {
      console.error("Failed to initialize agent registry:", err);
      setError("Failed to initialize agent registry");
      data.status = 'error';
    }
  };
  
  // Scan for available agents in the environment
  const scanForAgents = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setError(null);
    data.status = 'busy';
    
    try {
      // Use VS Code extension API to scan for agents
      const result = await window.vscode?.commands.executeCommand(
        'thefuse.registry.scan',
        {
          protocols: data.supportedProtocols,
          trustThreshold: data.trustThreshold
        }
      );
      
      if (result?.agents) {
        // Merge newly discovered agents with existing registry
        const existingIds = new Set(data.registeredAgents.map(agent => agent.id));
        const newAgents = result.agents.filter(agent => !existingIds.has(agent.id));
        
        if (newAgents.length > 0) {
          data.registeredAgents = [...data.registeredAgents, ...newAgents];
        }
        
        // Update status of all agents
        data.registeredAgents = data.registeredAgents.map(agent => {
          const updatedAgent = result.agents.find(a => a.id === agent.id);
          return updatedAgent || { ...agent, status: 'offline' };
        });
      }
      
      data.lastUpdated = new Date().toISOString();
      data.status = 'idle';
      
    } catch (err) {
      console.error("Error scanning for agents:", err);
      setError("Failed to scan for agents");
      data.status = 'error';
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Handle agent registration events
  const handleAgentRegistered = (agent: RegisteredAgent) => {
    // Check if the agent already exists
    const existingIndex = data.registeredAgents.findIndex(a => a.id === agent.id);
    
    if (existingIndex >= 0) {
      // Update existing agent
      data.registeredAgents[existingIndex] = {
        ...data.registeredAgents[existingIndex],
        ...agent,
        status: 'online',
        lastSeen: new Date().toISOString()
      };
    } else {
      // Add new agent
      data.registeredAgents.push({
        ...agent,
        status: 'online',
        lastSeen: new Date().toISOString()
      });
    }
    
    // Update lastUpdated timestamp
    data.lastUpdated = new Date().toISOString();
  };
  
  // Handle agent update events
  const handleAgentUpdated = (agent: RegisteredAgent) => {
    const existingIndex = data.registeredAgents.findIndex(a => a.id === agent.id);
    
    if (existingIndex >= 0) {
      data.registeredAgents[existingIndex] = {
        ...data.registeredAgents[existingIndex],
        ...agent,
        lastSeen: new Date().toISOString()
      };
      
      // Update lastUpdated timestamp
      data.lastUpdated = new Date().toISOString();
    }
  };
  
  // Handle agent unregistration events
  const handleAgentUnregistered = (agentId: string) => {
    const existingIndex = data.registeredAgents.findIndex(a => a.id === agentId);
    
    if (existingIndex >= 0) {
      // Mark as offline instead of removing
      data.registeredAgents[existingIndex] = {
        ...data.registeredAgents[existingIndex],
        status: 'offline',
        lastSeen: new Date().toISOString()
      };
      
      // Update lastUpdated timestamp
      data.lastUpdated = new Date().toISOString();
    }
  };
  
  // Manually verify an agent
  const verifyAgent = async (agentId: string) => {
    try {
      const result = await window.vscode?.commands.executeCommand(
        'thefuse.registry.verifyAgent',
        { agentId }
      );
      
      if (result?.verified) {
        const existingIndex = data.registeredAgents.findIndex(a => a.id === agentId);
        
        if (existingIndex >= 0) {
          data.registeredAgents[existingIndex] = {
            ...data.registeredAgents[existingIndex],
            verificationStatus: 'verified',
            trustScore: Math.max(data.registeredAgents[existingIndex].trustScore, 0.8),
            lastSeen: new Date().toISOString()
          };
          
          // Update lastUpdated timestamp
          data.lastUpdated = new Date().toISOString();
        }
      }
    } catch (err) {
      console.error("Error verifying agent:", err);
      setError("Failed to verify agent");
    }
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
          <ServerCog className="h-5 w-5 text-indigo-500" />
          <h3 className="font-medium text-sm">{data.name}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={scanForAgents}
            disabled={isRefreshing}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Scan for agents"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-blue-500' : 'text-gray-500'}`} />
          </button>
        </div>
      </div>
      
      {/* Status indicator */}
      {data.status === 'busy' && (
        <Toast
          variant="info"
          title="Registry is processing"
          description="Please wait while the registry scans for available agents..."
          className="mb-3 py-2"
        />
      )}
      
      {data.status === 'error' && (
        <Toast
          variant="destructive"
          title="Registry error"
          description={error || "An unknown error occurred"}
          className="mb-3 py-2"
        />
      )}
      
      {/* Registry stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded p-2 flex items-center gap-2">
          <Database className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <div>
            <div className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">Registered</div>
            <div className="text-sm font-semibold">{registeredCount} agents</div>
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-950/30 rounded p-2 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <div>
            <div className="text-xs text-green-700 dark:text-green-300 font-medium">Online</div>
            <div className="text-sm font-semibold">{onlineCount} agents</div>
          </div>
        </div>
      </div>
      
      {/* Registry configuration */}
      <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-850 rounded text-xs border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between mb-1">
          <span className="text-gray-600 dark:text-gray-400">Trust threshold:</span>
          <span className="font-medium">{data.trustThreshold * 100}%</span>
        </div>
        <div className="flex justify-between mb-1">
          <span className="text-gray-600 dark:text-gray-400">Auto-discovery:</span>
          <span className={`font-medium ${data.enableAutoDiscovery ? 'text-green-600' : 'text-gray-600'}`}>
            {data.enableAutoDiscovery ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Cross-chain:</span>
          <span className={`font-medium ${data.enableCrossChainRegistry ? 'text-green-600' : 'text-gray-600'}`}>
            {data.enableCrossChainRegistry ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>
      
      {/* Registered agents */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>Registered Agents</span>
          </h4>
        </div>
        
        <div className="max-h-[180px] overflow-y-auto space-y-1.5">
          {data.registeredAgents.length > 0 ? (
            data.registeredAgents.map(agent => (
              <div 
                key={agent.id} 
                className="text-xs border border-gray-100 dark:border-gray-700 rounded p-1.5 flex items-start"
              >
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <span className="font-medium truncate max-w-[180px]">{agent.name}</span>
                    <span className={`ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                      agent.status === 'online' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : agent.status === 'degraded'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {agent.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <span className="flex items-center">
                      <Shield className="h-3 w-3 mr-0.5" />
                      {agent.trustScore.toFixed(2)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center text-[10px]">
                      {agent.protocols.join(', ')}
                    </span>
                  </div>
                </div>
                <div>
                  {agent.verificationStatus === 'verified' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" title="Verified" />
                  ) : agent.verificationStatus === 'pending' ? (
                    <button 
                      onClick={() => verifyAgent(agent.id)}
                      className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-[10px] px-1.5 py-0.5 rounded"
                    >
                      Verify
                    </button>
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" title="Unverified" />
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-gray-400 dark:text-gray-500">
              <Users className="h-8 w-8 mb-2 opacity-20" />
              <span className="text-xs">No agents registered</span>
              <button 
                onClick={scanForAgents} 
                className="mt-2 text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Scan for agents
              </button>
            </div>
          )}
        </div>
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

export default AgentRegistryNode;