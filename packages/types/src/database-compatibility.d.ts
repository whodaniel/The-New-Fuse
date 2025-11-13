/**
 * Database Compatibility Layer
 *
 * This file provides compatibility types and utilities to help transition from
 * Prisma-generated types to standardized types in the @the-new-fuse/types package.
 *
 * This ensures backward compatibility while migrating away from direct @prisma/client imports.
 */
import { AgentStatus, AgentType, AgentRole, AgentCapability } from './core/enums';
import { WorkflowStatus, WorkflowExecutionStatus, WorkflowAgentType } from './workflow';
/**
 * Compatibility aliases for Prisma-generated types
 * These allow existing code to continue using familiar names while
 * transitioning to standardized type definitions
 */
export type PrismaAgentStatus = AgentStatus;
export type PrismaAgentType = AgentType;
export type PrismaAgentRole = AgentRole;
export type PrismaAgentCapability = AgentCapability;
export type PrismaWorkflowStatus = WorkflowStatus;
export type PrismaWorkflowExecutionStatus = WorkflowExecutionStatus;
export type PrismaWorkflowAgentType = WorkflowAgentType;
/**
 * Type guard to check if a value is a valid AgentStatus
 */
export declare function isValidAgentStatus(value: any): value is AgentStatus;
/**
 * Type guard to check if a value is a valid AgentType
 */
export declare function isValidAgentType(value: any): value is AgentType;
/**
 * Type guard to check if a value is a valid WorkflowStatus
 */
export declare function isValidWorkflowStatus(value: any): value is WorkflowStatus;
/**
 * Type guard to check if a value is a valid WorkflowExecutionStatus
 */
export declare function isValidWorkflowExecutionStatus(value: any): value is WorkflowExecutionStatus;
/**
 * Type guard to check if a value is a valid WorkflowAgentType
 */
export declare function isValidWorkflowAgentType(value: any): value is WorkflowAgentType;
/**
 * Safely converts a string to AgentStatus with fallback
 */
export declare function toAgentStatus(value: string | undefined | null, fallback?: AgentStatus): AgentStatus;
/**
 * Safely converts a string to AgentType with fallback
 */
export declare function toAgentType(value: string | undefined | null, fallback?: AgentType): AgentType;
/**
 * Safely converts a string to WorkflowStatus with fallback
 */
export declare function toWorkflowStatus(value: string | undefined | null, fallback?: WorkflowStatus): WorkflowStatus;
/**
 * Safely converts a string to WorkflowExecutionStatus with fallback
 */
export declare function toWorkflowExecutionStatus(value: string | undefined | null, fallback?: WorkflowExecutionStatus): WorkflowExecutionStatus;
/**
 * Safely converts a string to WorkflowAgentType with fallback
 */
export declare function toWorkflowAgentType(value: string | undefined | null, fallback?: WorkflowAgentType): WorkflowAgentType;
/**
 * Helper interface for migrating from Prisma-generated agent types
 */
export interface PrismaAgentCompatibility {
    /**
     * Convert Prisma agent data to standardized types
     */
    convertAgentData(prismaAgent: any): {
        status: AgentStatus;
        type: AgentType;
        role?: AgentRole;
        capabilities?: AgentCapability[];
    };
}
/**
 * Helper interface for migrating from Prisma-generated workflow types
 */
export interface PrismaWorkflowCompatibility {
    /**
     * Convert Prisma workflow data to standardized types
     */
    convertWorkflowData(prismaWorkflow: any): {
        status: WorkflowStatus;
        executionStatus?: WorkflowExecutionStatus;
    };
}
/**
 * Default implementation of PrismaAgentCompatibility
 */
export declare const defaultAgentCompatibility: PrismaAgentCompatibility;
/**
 * Default implementation of PrismaWorkflowCompatibility
 */
export declare const defaultWorkflowCompatibility: PrismaWorkflowCompatibility;
/**
 * @deprecated Use AgentStatus from @the-new-fuse/types instead
 * This exists only for backward compatibility during migration
 */
export declare const DeprecatedAgentStatus: any;
/**
 * @deprecated Use AgentType from @the-new-fuse/types instead
 * This exists only for backward compatibility during migration
 */
export declare const DeprecatedAgentType: any;
/**
 * @deprecated Use WorkflowStatus from @the-new-fuse/types instead
 * This exists only for backward compatibility during migration
 */
export declare const DeprecatedWorkflowStatus: any;
/**
 * @deprecated Use WorkflowExecutionStatus from @the-new-fuse/types instead
 * This exists only for backward compatibility during migration
 */
export declare const DeprecatedWorkflowExecutionStatus: any;
export { AgentStatus, AgentType, AgentRole, AgentCapability, WorkflowStatus, WorkflowExecutionStatus, WorkflowAgentType };
//# sourceMappingURL=database-compatibility.d.ts.map