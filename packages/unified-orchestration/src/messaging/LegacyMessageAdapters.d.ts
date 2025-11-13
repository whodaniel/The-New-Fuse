/**
 * Legacy Message Adapters for Backward Compatibility
 *
 * This module provides conversion functions between legacy message formats
 * from existing systems and the new unified message format.
 */
import { UnifiedMessage, LegacyMessageMappings } from './UnifiedMessageTypes';
/**
 * CLI Agent Legacy Message Adapters
 */
export declare class CLIAgentAdapter {
    /**
     * Convert CLI agent request to unified format
     */
    static toUnified(cliMessage: any): UnifiedMessage;
    /**
     * Convert unified message to CLI agent format
     */
    static fromUnified(unifiedMessage: UnifiedMessage): any;
    private static mapMessageType;
    private static mapToCliCommand;
    private static mapPriority;
}
/**
 * Workflow Engine Legacy Message Adapters
 */
export declare class WorkflowEngineAdapter {
    /**
     * Convert workflow message to unified format
     */
    static toUnified(workflowMessage: any): UnifiedMessage;
    /**
     * Convert unified message to workflow format
     */
    static fromUnified(unifiedMessage: UnifiedMessage): any;
    private static mapWorkflowEventType;
    private static mapToWorkflowEvent;
    private static mapPriority;
    private static mapStatus;
}
/**
 * Sync System Legacy Message Adapters
 */
export declare class SyncSystemAdapter {
    /**
     * Convert sync message to unified format
     */
    static toUnified(syncMessage: any): UnifiedMessage;
    /**
     * Convert unified message to sync format
     */
    static fromUnified(unifiedMessage: UnifiedMessage): any;
    private static mapStatus;
}
/**
 * Task Management Legacy Message Adapters
 */
export declare class TaskManagementAdapter {
    /**
     * Convert task management message to unified format
     */
    static toUnified(taskMessage: any): UnifiedMessage;
    /**
     * Convert unified message to task management format
     */
    static fromUnified(unifiedMessage: UnifiedMessage): any;
    private static mapTaskEventType;
    private static mapToTaskEvent;
    private static mapPriority;
    private static mapStatus;
}
/**
 * Create the complete legacy message mappings
 */
export declare function createLegacyMessageMappings(): LegacyMessageMappings;
/**
 * Auto-detect legacy message format
 */
export declare function detectLegacyMessageFormat(message: any): string | null;
//# sourceMappingURL=LegacyMessageAdapters.d.ts.map