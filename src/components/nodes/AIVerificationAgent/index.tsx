import React, { useState, useEffect, useCallback } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Shield, 
  Filter, 
  List, 
  Clock
} from "lucide-react";
import { Toast } from '../../../packages/ui-components/src/core/toast.js';
import { Progress } from '../../../packages/ui-components/src/core/progress.js';
import { 
  AgentCapability, 
  AgentProtocol, 
  AgentTrustLevel 
} from '../../../packages/core/types/src/agent.js';
import { Badge } from '../../../packages/ui-components/src/core/badge.js';

/**
 * Information Source Type Enum
 */
export enum SourceType {
  ACADEMIC = 'academic',
  NEWS = 'news',
  OFFICIAL = 'official',
  EXPERT = 'expert',
  CROWD = 'crowd',
  UNKNOWN = 'unknown'
}

/**
 * Verification Level Enum
 */
export enum VerificationLevel {
  STRICT = 'strict',       // Requires multiple credible sources
  STANDARD = 'standard',   // Requires at least one credible source
  PERMISSIVE = 'permissive' // Accept with minimal verification
}

/**
 * Claim Interface
 */
export interface Claim {
  id: string;
  text: string;
  source?: string;
  metadata?: any;
  verificationStatus: 'verified' | 'refuted' | 'unverified' | 'insufficient_data';
  confidenceScore: number; // 0.0-1.0
  verificationSources?: VerificationSource[];
  verifiedAt?: string; // ISO date string
  tags?: string[];
}

/**
 * Verification Source Interface
 */
export interface VerificationSource {
  name: string;
  url: string;
  type: SourceType;
  reliability: number; // 0.0-1.0
  excerpt?: string;
  creationDate?: string; // ISO date string
  retrievedAt: string; // ISO date string
}

/**
 * AI Verification Agent Node Data Interface
 */
export interface AIVerificationAgentNodeData {
  id: string;
  name: string;
  verificationLevel: VerificationLevel;
  claims: Claim[];
  pendingClaims: Claim[];
  status: 'idle' | 'busy' | 'error';
  lastUpdated: string | null;
  supportedProtocols: AgentProtocol[];
  trustedSources: string[];
  minConfidenceThreshold: number; // 0.0-1.0
  maxResponseTime: number; // seconds
  maxClaims: number;
  autoVerify: boolean;
}

/**
 * Default AI Verification Agent Node Data
 */
export const defaultAIVerificationAgentData: AIVerificationAgentNodeData = {
  id: crypto.randomUUID(),
  name: "Verification Agent",
  verificationLevel: VerificationLevel.STANDARD,
  claims: [],
  pendingClaims: [],
  status: 'idle',
  lastUpdated: null,
  supportedProtocols: [AgentProtocol.A2A, AgentProtocol.MCP],
  trustedSources: ["arxiv.org", "nih.gov", "reuters.com", "nature.com", "science.org"],
  minConfidenceThreshold: 0.6,
  maxResponseTime: 30,
  maxClaims: 50,
  autoVerify: true
};

/**
 * AI Verification Agent Node Component
 * 
 * Specialized agent for fact-checking and verifying claims from other agents
 */
const AIVerificationAgent: React.FC<NodeProps<AIVerificationAgentNodeData>> = ({ 
  data, 
  isConnectable,
  selected
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentClaimId, setCurrentClaimId] = useState<string | null>(null);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [activeFilter, setActiveFilter] = useState<'all' | 'verified' | 'refuted' | 'unverified'>('all');
  
  // Initialize agent on mount
  useEffect(() => {
    initializeAgent();
    
    // Set up automatic verification if enabled
    if (data.autoVerify) {
      const interval = setInterval(() => {
        if (data.pendingClaims.length > 0 && data.status === 'idle') {
          verifyClaim(data.pendingClaims[0].id);
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [data.autoVerify]);
  
  // Initialize the verification agent
  const initializeAgent = async () => {
    try {
      data.status = 'busy';
      
      // Use VS Code extension API to initialize the verification agent
      const result = await window.vscode?.commands.executeCommand(
        'thefuse.verification.initialize',
        {
          id: data.id,
          name: data.name,
          supportedProtocols: data.supportedProtocols,
          capabilities: [
            AgentCapability.TASK_EXECUTION,
            AgentCapability.WEB_BROWSING,
            AgentCapability.WEB_SEARCH,
            AgentCapability.DATA_PROCESSING,
            AgentCapability.REASONING
          ],
          verificationLevel: data.verificationLevel,
          minConfidenceThreshold: data.minConfidenceThreshold,
          trustedSources: data.trustedSources,
          maxResponseTime: data.maxResponseTime
        }
      );
      
      if (result?.claims) {
        // Initialize with existing claims
        data.claims = result.claims;
      }
      
      data.lastUpdated = new Date().toISOString();
      data.status = 'idle';
      
      // Subscribe to new claim events
      await window.vscode?.commands.executeCommand(
        'thefuse.orchestrator.subscribe',
        {
          recipient: data.id,
          action: 'verification.request',
          callback: (message: any) => {
            if (message.claim) {
              handleNewClaim(message.claim);
            }
          }
        }
      );
      
    } catch (err) {
      console.error("Failed to initialize verification agent:", err);
      setError("Failed to initialize verification agent");
      data.status = 'error';
    }
  };
  
  // Handle a new claim submitted for verification
  const handleNewClaim = (claim: Claim) => {
    // Ensure the claim has an ID
    if (!claim.id) {
      claim.id = crypto.randomUUID();
    }
    
    // Set initial verification status
    claim.verificationStatus = 'unverified';
    claim.confidenceScore = 0;
    
    // Add to pending claims
    data.pendingClaims.push(claim);
    
    // Limit the number of claims
    while (data.claims.length + data.pendingClaims.length > data.maxClaims) {
      // Remove oldest claim
      data.claims.shift();
    }
    
    data.lastUpdated = new Date().toISOString();
    
    // Auto-verify if enabled and idle
    if (data.autoVerify && data.status === 'idle') {
      verifyClaim(claim.id);
    }
  };
  
  // Verify a specific claim
  const verifyClaim = async (claimId: string) => {
    // Find the claim (either in pending or previously processed)
    const pendingIndex = data.pendingClaims.findIndex(c => c.id === claimId);
    const existingIndex = data.claims.findIndex(c => c.id === claimId);
    
    if (pendingIndex === -1 && existingIndex === -1) {
      console.error(`Claim with ID ${claimId} not found`);
      return;
    }
    
    if (isProcessing) {
      return;
    }
    
    setIsProcessing(true);
    setCurrentClaimId(claimId);
    setVerificationProgress(0);
    setError(null);
    data.status = 'busy';
    
    try {
      // Get the claim to verify
      const claim = pendingIndex !== -1 
        ? data.pendingClaims[pendingIndex] 
        : data.claims[existingIndex];
      
      // Set up progress tracking
      const progressInterval = setInterval(() => {
        setVerificationProgress(prev => {
          const newProgress = prev + Math.random() * 5;
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 500);
      
      // Use VS Code extension API to verify the claim
      const result = await window.vscode?.commands.executeCommand(
        'thefuse.verification.verifyClaim',
        {
          agentId: data.id,
          claim: claim,
          verificationLevel: data.verificationLevel,
          minConfidenceThreshold: data.minConfidenceThreshold,
          trustedSources: data.trustedSources,
          maxResponseTime: data.maxResponseTime
        }
      );
      
      clearInterval(progressInterval);
      setVerificationProgress(100);
      
      if (result?.verifiedClaim) {
        // Process the verified claim result
        const verifiedClaim = result.verifiedClaim;
        
        // Remove from pending if it was there
        if (pendingIndex !== -1) {
          data.pendingClaims.splice(pendingIndex, 1);
        } else if (existingIndex !== -1) {
          // Remove old version from claims
          data.claims.splice(existingIndex, 1);
        }
        
        // Add verified claim to the claims list
        data.claims.push(verifiedClaim);
        
        // Broadcast verification result
        await window.vscode?.commands.executeCommand(
          'thefuse.orchestrator.sendMessage',
          {
            sender: data.id,
            action: 'verification.result',
            payload: {
              claim: verifiedClaim,
              timestamp: new Date().toISOString()
            }
          }
        );
      }
      
      data.lastUpdated = new Date().toISOString();
      data.status = 'idle';
      
      // Brief delay before resetting UI
      setTimeout(() => {
        setVerificationProgress(0);
        setCurrentClaimId(null);
      }, 1000);
      
    } catch (err) {
      console.error("Error verifying claim:", err);
      setError("Failed to verify claim");
      data.status = 'error';
      clearInterval(progressInterval);
      setVerificationProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Change verification level
  const changeVerificationLevel = async (level: VerificationLevel) => {
    try {
      const result = await window.vscode?.commands.executeCommand(
        'thefuse.verification.setLevel',
        {
          agentId: data.id,
          level
        }
      );
      
      if (result?.success) {
        data.verificationLevel = level;
        data.lastUpdated = new Date().toISOString();
      }
    } catch (err) {
      console.error("Error changing verification level:", err);
      setError("Failed to change verification level");
    }
  };
  
  // Get filtered claims based on activeFilter
  const getFilteredClaims = useCallback(() => {
    if (activeFilter === 'all') {
      return data.claims.slice(-5).reverse();
    }
    
    return data.claims
      .filter(claim => {
        if (activeFilter === 'verified') return claim.verificationStatus === 'verified';
        if (activeFilter === 'refuted') return claim.verificationStatus === 'refuted';
        if (activeFilter === 'unverified') return claim.verificationStatus === 'unverified' || claim.verificationStatus === 'insufficient_data';
        return true;
      })
      .slice(-5)
      .reverse();
  }, [data.claims, activeFilter]);
  
  // Get status badge variant based on verification status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'verified':
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case 'refuted':
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case 'unverified':
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case 'insufficient_data':
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400";
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
          <Shield className="h-5 w-5 text-green-500" />
          <h3 className="font-medium text-sm">{data.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
            {data.verificationLevel}
          </Badge>
        </div>
      </div>
      
      {/* Status indicator */}
      {data.status === 'busy' && !isProcessing && (
        <Toast
          variant="info"
          title="Initializing verification agent"
          description="Please wait while the agent is being initialized..."
          className="mb-3 py-2"
        />
      )}
      
      {isProcessing && currentClaimId && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Verifying claim</span>
            </div>
            <div className="text-xs text-gray-500">{verificationProgress.toFixed(0)}%</div>
          </div>
          <Progress value={verificationProgress} className="h-1.5" />
        </div>
      )}
      
      {data.status === 'error' && (
        <Toast
          variant="destructive"
          title="Verification error"
          description={error || "An unknown error occurred"}
          className="mb-3 py-2"
        />
      )}
      
      {/* Verification levels */}
      <div className="mb-4">
        <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
          <Shield className="h-3.5 w-3.5" />
          <span>Verification Level</span>
        </h4>
        
        <div className="flex flex-wrap gap-1">
          {Object.values(VerificationLevel).map(level => (
            <button
              key={level}
              onClick={() => changeVerificationLevel(level)}
              className={`px-2 py-1 rounded text-xs ${
                data.verificationLevel === level
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-medium'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
      
      {/* Pending claims */}
      {data.pendingClaims.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>Pending Claims ({data.pendingClaims.length})</span>
          </h4>
          
          <div className="max-h-[80px] overflow-y-auto space-y-1.5">
            {data.pendingClaims.map(claim => (
              <div 
                key={claim.id} 
                className="text-xs border border-yellow-100 dark:border-yellow-900/30 bg-yellow-50 dark:bg-yellow-900/10 rounded p-1.5"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium truncate max-w-[200px]">{claim.text.substring(0, 50)}{claim.text.length > 50 ? '...' : ''}</span>
                  <button
                    onClick={() => verifyClaim(claim.id)}
                    disabled={isProcessing}
                    className="text-[10px] bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded"
                  >
                    Verify
                  </button>
                </div>
                {claim.source && (
                  <div className="text-gray-500">Source: {claim.source}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Claims filter */}
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium flex items-center gap-1">
            <List className="h-3.5 w-3.5" />
            <span>Verified Claims</span>
          </h4>
          <div className="flex items-center gap-1">
            <Filter className="h-3 w-3 text-gray-500" />
            <select 
              className="text-[10px] bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as any)}
            >
              <option value="all">All</option>
              <option value="verified">Verified</option>
              <option value="refuted">Refuted</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Claims list */}
      <div className="mb-3">
        <div className="max-h-[200px] overflow-y-auto space-y-1.5">
          {getFilteredClaims().length > 0 ? (
            getFilteredClaims().map(claim => (
              <div 
                key={claim.id} 
                className="text-xs border border-gray-100 dark:border-gray-700 rounded p-1.5"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium truncate max-w-[200px]">{claim.text.substring(0, 50)}{claim.text.length > 50 ? '...' : ''}</span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                    getStatusBadgeVariant(claim.verificationStatus)
                  }`}>
                    {claim.verificationStatus.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  {claim.source && (
                    <span className="text-gray-500 truncate max-w-[150px]">Source: {claim.source}</span>
                  )}
                  <div className="flex items-center gap-1 text-gray-500">
                    <span className="text-xs">Confidence:</span>
                    <div className={`px-1 rounded ${
                      claim.confidenceScore > 0.7 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : claim.confidenceScore > 0.4
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {(claim.confidenceScore * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
                
                {/* Verification sources */}
                {claim.verificationSources && claim.verificationSources.length > 0 && (
                  <div className="mt-1 pt-1 border-t border-gray-100 dark:border-gray-700">
                    <div className="text-gray-600 dark:text-gray-400 text-[10px]">Sources:</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {claim.verificationSources.slice(0, 3).map((source, idx) => (
                        <span 
                          key={idx} 
                          className="px-1 py-0.5 bg-gray-50 dark:bg-gray-700 rounded text-[10px]"
                          title={source.url}
                        >
                          {source.name}
                        </span>
                      ))}
                      {claim.verificationSources.length > 3 && (
                        <span className="text-[10px] text-gray-500">+{claim.verificationSources.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-gray-400 dark:text-gray-500">
              <CheckCircle className="h-5 w-5 mb-1 opacity-20" />
              <span className="text-xs">No verified claims yet</span>
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

export default AIVerificationAgent;