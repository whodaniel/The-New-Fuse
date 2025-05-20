export declare class WorkflowValidator {
    validate(nodes: any[], edges: any[], nodeTypes: any[]): string[];
    private validateNodeParameters;
    private validateNodeCredentials;
    private validateConnections;
    private isValidConnection;
    private checkCircularDependencies;
}
