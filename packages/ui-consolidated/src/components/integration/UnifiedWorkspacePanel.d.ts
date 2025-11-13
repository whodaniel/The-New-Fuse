/**
 * Unified Workspace Panel
 *
 * Demonstration component showcasing maximum cohesive synergy between
 * human and AI interactions in a single unified interface.
 */
import React from 'react';
interface UnifiedWorkspacePanelProps {
    integrationService: any;
    userId: string;
    userType: 'human' | 'ai_agent' | 'hybrid';
    onTaskCreated?: (task: any) => void;
    onWorkflowExecuted?: (workflow: any) => void;
    onAgentInteraction?: (interaction: any) => void;
}
export declare const UnifiedWorkspacePanel: React.FC<UnifiedWorkspacePanelProps>;
export {};
//# sourceMappingURL=UnifiedWorkspacePanel.d.ts.map