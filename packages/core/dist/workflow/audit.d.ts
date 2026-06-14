interface DateRange {
    startDate: Date;
    endDate: Date;
}
interface WorkflowAuditEvent {
    id: string;
    type: string;
    workflowId: string;
    stepId?: string;
    timestamp?: Date;
    actor?: string;
    context?: Record<string, unknown>;
    signatures?: string[];
    details?: Record<string, unknown>;
}
interface ComplianceReport {
    workflowId: string;
    timeRange: DateRange;
    events: WorkflowAuditEvent[];
    violations: any[];
    recommendations: string[];
}
export declare class WorkflowAuditSystem {
    private readonly auditLogger;
    private readonly complianceRules;
    constructor();
    recordAuditEvent(event: WorkflowAuditEvent): Promise<void>;
    generateComplianceReport(workflowId: string, timeRange: DateRange): Promise<ComplianceReport>;
    private getCurrentActor;
    private getAuditContext;
    private generateEventSignatures;
    private checkComplianceViolations;
    private generateRecommendations;
    exportAuditTrail(workflowId: string, format: string): Promise<string>;
    private convertToCsv;
    private generatePdfReport;
}
export {};
//# sourceMappingURL=audit.d.ts.map