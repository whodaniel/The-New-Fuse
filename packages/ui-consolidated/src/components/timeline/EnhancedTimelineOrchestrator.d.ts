/**
 * Enhanced Timeline Orchestrator
 *
 * Advanced timeline modality that integrates all discovered framework capabilities:
 * - Redis pub/sub for real-time updates
 * - Agent communication bridges
 * - Multi-protocol coordination
 * - Workflow orchestration patterns
 * - File-based protocols
 * - Handoff management
 *
 * This component provides a unified timeline interface that visualizes and manages
 * all framework activities across time dimensions.
 */
import React from 'react';
export interface EnhancedTimelineEvent {
    id: string;
    timestamp: Date;
    type: 'agent_communication' | 'workflow_execution' | 'handoff' | 'file_protocol' | 'redis_message' | 'bridge_event' | 'orchestration';
    title: string;
    description: string;
    source: {
        type: 'agent' | 'workflow' | 'user' | 'system';
        id: string;
        name: string;
    };
    target?: {
        type: 'agent' | 'workflow' | 'user' | 'system';
        id: string;
        name: string;
    };
    data: any;
    metadata: {
        protocol?: string;
        priority?: 'low' | 'medium' | 'high' | 'critical';
        duration?: number;
        status?: 'pending' | 'in_progress' | 'completed' | 'failed';
        correlationId?: string;
        parentEventId?: string;
        childEventIds?: string[];
    };
    visualization: {
        color: string;
        icon: string;
        size: 'small' | 'medium' | 'large';
        category: string;
    };
}
export interface TimelineBranch {
    id: string;
    name: string;
    startEventId: string;
    parentBranchId?: string;
    createdAt: Date;
    events: EnhancedTimelineEvent[];
    mergeStatus: 'active' | 'merged' | 'conflicted';
    metadata: {
        author: string;
        description: string;
        tags: string[];
    };
}
export interface TimelineFilter {
    eventTypes: string[];
    sourceTypes: string[];
    timeRange: {
        start: Date;
        end: Date;
    };
    priorities: string[];
    statuses: string[];
    searchQuery: string;
    correlationIds: string[];
}
export interface TimelineVisualizationConfig {
    layout: 'horizontal' | 'vertical' | 'circular' | 'hierarchical';
    density: 'compact' | 'normal' | 'expanded';
    grouping: 'none' | 'by_type' | 'by_source' | 'by_correlation' | 'by_workflow';
    realTimeUpdates: boolean;
    showMinimap: boolean;
    enableZoom: boolean;
    showConnections: boolean;
    animationSpeed: number;
}
interface EnhancedTimelineOrchestratorProps {
    integrationService: any;
    eventStreamService: any;
    onEventSelect?: (event: EnhancedTimelineEvent) => void;
    onBranchCreate?: (branch: TimelineBranch) => void;
    onEventAnalyze?: (event: EnhancedTimelineEvent) => void;
    height?: number;
    enableRealTime?: boolean;
    enableBranching?: boolean;
    enableAnalytics?: boolean;
}
export declare const EnhancedTimelineOrchestrator: React.FC<EnhancedTimelineOrchestratorProps>;
export default EnhancedTimelineOrchestrator;
//# sourceMappingURL=EnhancedTimelineOrchestrator.d.ts.map