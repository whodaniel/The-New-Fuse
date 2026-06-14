import { AgentType } from './agent.type';
import { WorkflowType } from './workflow.type';
export declare class UserType {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    roles: string[];
    isActive: boolean;
    lastLoginAt?: Date;
    agents?: AgentType[];
    workflows?: WorkflowType[];
    createdAt: Date;
    updatedAt: Date;
    preferences?: string;
    metadata?: string;
    fullName?: string;
}
//# sourceMappingURL=user.type.d.ts.map