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
// ========================================
// TYPE GUARDS
// ========================================
/**
 * Type guard to check if a value is a valid AgentStatus
 */
export function isValidAgentStatus(value) {
    return Object.values(AgentStatus).includes(value);
}
/**
 * Type guard to check if a value is a valid AgentType
 */
export function isValidAgentType(value) {
    return Object.values(AgentType).includes(value);
}
/**
 * Type guard to check if a value is a valid WorkflowStatus
 */
export function isValidWorkflowStatus(value) {
    return Object.values(WorkflowStatus).includes(value);
}
/**
 * Type guard to check if a value is a valid WorkflowExecutionStatus
 */
export function isValidWorkflowExecutionStatus(value) {
    return Object.values(WorkflowExecutionStatus).includes(value);
}
/**
 * Type guard to check if a value is a valid WorkflowAgentType
 */
export function isValidWorkflowAgentType(value) {
    return Object.values(WorkflowAgentType).includes(value);
}
// ========================================
// CONVERSION UTILITIES
// ========================================
/**
 * Safely converts a string to AgentStatus with fallback
 */
export function toAgentStatus(value, fallback = AgentStatus.INACTIVE) {
    if (!value)
        return fallback;
    return isValidAgentStatus(value) ? value : fallback;
}
/**
 * Safely converts a string to AgentType with fallback
 */
export function toAgentType(value, fallback = AgentType.ASSISTANT) {
    if (!value)
        return fallback;
    return isValidAgentType(value) ? value : fallback;
}
/**
 * Safely converts a string to WorkflowStatus with fallback
 */
export function toWorkflowStatus(value, fallback = WorkflowStatus.DRAFT) {
    if (!value)
        return fallback;
    return isValidWorkflowStatus(value) ? value : fallback;
}
/**
 * Safely converts a string to WorkflowExecutionStatus with fallback
 */
export function toWorkflowExecutionStatus(value, fallback = WorkflowExecutionStatus.PENDING) {
    if (!value)
        return fallback;
    return isValidWorkflowExecutionStatus(value) ? value : fallback;
}
/**
 * Safely converts a string to WorkflowAgentType with fallback
 */
export function toWorkflowAgentType(value, fallback = WorkflowAgentType.AI) {
    if (!value)
        return fallback;
    return isValidWorkflowAgentType(value) ? value : fallback;
}
/**
 * Default implementation of PrismaAgentCompatibility
 */
export const defaultAgentCompatibility = {
    convertAgentData(prismaAgent) {
        return {
            status: toAgentStatus(prismaAgent?.status),
            type: toAgentType(prismaAgent?.type),
            role: prismaAgent?.role ? prismaAgent.role : undefined,
            capabilities: Array.isArray(prismaAgent?.capabilities) ?
                prismaAgent.capabilities.filter((cap) => Object.values(AgentCapability).includes(cap)) :
                undefined
        };
    }
};
/**
 * Default implementation of PrismaWorkflowCompatibility
 */
export const defaultWorkflowCompatibility = {
    convertWorkflowData(prismaWorkflow) {
        return {
            status: toWorkflowStatus(prismaWorkflow?.status),
            executionStatus: prismaWorkflow?.executionStatus ?
                toWorkflowExecutionStatus(prismaWorkflow.executionStatus) :
                undefined
        };
    }
};
// ========================================
// DEPRECATED TYPE MAPPINGS
// ========================================
/**
 * @deprecated Use AgentStatus from @the-new-fuse/types instead
 * This exists only for backward compatibility during migration
 */
export const DeprecatedAgentStatus = AgentStatus;
/**
 * @deprecated Use AgentType from @the-new-fuse/types instead
 * This exists only for backward compatibility during migration
 */
export const DeprecatedAgentType = AgentType;
/**
 * @deprecated Use WorkflowStatus from @the-new-fuse/types instead
 * This exists only for backward compatibility during migration
 */
export const DeprecatedWorkflowStatus = WorkflowStatus;
/**
 * @deprecated Use WorkflowExecutionStatus from @the-new-fuse/types instead
 * This exists only for backward compatibility during migration
 */
export const DeprecatedWorkflowExecutionStatus = WorkflowExecutionStatus;
// ========================================
// EXPORTS FOR EASY TRANSITION
// ========================================
// Re-export standardized types for easy access
export { AgentStatus, AgentType, AgentRole, AgentCapability, WorkflowStatus, WorkflowExecutionStatus, WorkflowAgentType };
//# sourceMappingURL=database-compatibility.js.map