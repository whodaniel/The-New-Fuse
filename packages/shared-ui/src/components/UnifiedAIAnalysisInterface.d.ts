import React from 'react';
interface AnalysisSession {
    id: string;
    type: string;
    status: 'pending' | 'active' | 'completed' | 'error';
    startedAt: string;
    completedAt?: string;
    results?: any;
    agents: string[];
    source: {
        type: 'tab' | 'file' | 'workspace' | 'desktop' | 'custom';
        identifier: string;
        metadata?: any;
    };
}
interface ConnectedAgent {
    id: string;
    name: string;
    type: 'vision' | 'code' | 'accessibility' | 'security' | 'performance';
    status: 'connected' | 'busy' | 'offline';
    capabilities: string[];
    lastActivity?: string;
}
export interface UnifiedAIAnalysisProps {
    platform: 'web' | 'electron' | 'vscode' | 'chrome';
    onAnalysisComplete?: (session: AnalysisSession) => void;
    onAgentConnect?: (agent: ConnectedAgent) => void;
    initialAnalysisTypes?: string[];
    showStreamingControls?: boolean;
    showFileUpload?: boolean;
    allowCustomSource?: boolean;
}
export declare const UnifiedAIAnalysisInterface: React.FC<UnifiedAIAnalysisProps>;
export default UnifiedAIAnalysisInterface;
//# sourceMappingURL=UnifiedAIAnalysisInterface.d.ts.map