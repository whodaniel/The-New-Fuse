export declare class WorkflowSecurityManager {
    private readonly rbacManager;
    private readonly encryptionService;
    private readonly tokenManager;
    authorizeWorkflowAccess(): Promise<void>;
}
