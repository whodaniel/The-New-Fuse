import { WorkflowTemplate } from '../types/types.js';
interface User {
    id: string;
    roles: string[];
}
type WorkflowAction = 'read' | 'write' | 'execute' | 'delete';
interface AuthorizationResult {
    authorized: boolean;
    token: string;
}
interface EncryptedWorkflow {
    workflow: WorkflowTemplate;
    encryptedFields: string[];
}
interface SecurityValidationResult {
    securityLevel: string;
    vulnerabilities: string[];
    recommendations: string[];
}
interface RBACManager {
    getUserPermissions(user: User): Promise<any[]>;
    getSensitiveFields(workflow: WorkflowTemplate): Promise<string[]>;
}
interface EncryptionService {
    encrypt(workflow: WorkflowTemplate, sensitiveFields: string[]): Promise<EncryptedWorkflow>;
}
interface TokenManager {
    generateToken(user: User, workflowId: string, action: WorkflowAction): Promise<string>;
}
export declare class WorkflowSecurityManager {
    private readonly rbacManager;
    private readonly encryptionService;
    private readonly tokenManager;
    constructor(rbacManager: RBACManager, encryptionService: EncryptionService, tokenManager: TokenManager);
    authorizeWorkflowAccess(user: User, workflowId: string, action: WorkflowAction): Promise<AuthorizationResult>;
    encryptWorkflow(workflow: WorkflowTemplate): Promise<EncryptedWorkflow>;
    validateWorkflowSecurity(workflow: WorkflowTemplate): Promise<SecurityValidationResult>;
    private checkPermissions;
    private assessSecurityLevel;
    private scanForVulnerabilities;
    private generateSecurityRecommendations;
}
export {};
//# sourceMappingURL=security.d.ts.map