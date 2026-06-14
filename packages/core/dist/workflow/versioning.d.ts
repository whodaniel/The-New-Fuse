export interface Migration {
    from: string;
    to: string;
    migrate(workflow: any): any;
}
export declare class WorkflowVersionManager {
    private readonly logger;
    private readonly migrations;
    constructor();
    migrateWorkflow(workflow: any, targetVersion: string): Promise<any>;
    private calculateMigrationPath;
    private applyMigration;
    private registerMigrations;
    getSupportedVersions(): string[];
    isVersionSupported(version: string): boolean;
}
//# sourceMappingURL=versioning.d.ts.map