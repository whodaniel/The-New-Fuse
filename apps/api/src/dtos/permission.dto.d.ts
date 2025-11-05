declare class AgentPermissionDto {
    agentId: string;
    agentName: string;
}
export declare class UserPermissionsDto {
    userId: string;
    allowedAgents: AgentPermissionDto[];
}
export declare class UpdateUserPermissionsDto {
    agentIds: string[];
}
export {};
//# sourceMappingURL=permission.dto.d.ts.map