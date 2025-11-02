import type { PackageInfo } from '../scanner/FileSystemScanner';
export interface PrismaModel {
    name: string;
    fields: PrismaField[];
    relations: PrismaRelation[];
    enums: string[];
    indexes: string[];
    location: string;
}
export interface PrismaField {
    name: string;
    type: string;
    isOptional: boolean;
    isArray: boolean;
    isId: boolean;
    isUnique: boolean;
    hasDefault: boolean;
    defaultValue?: string;
    attributes: string[];
}
export interface PrismaRelation {
    name: string;
    type: string;
    relatedModel: string;
    relationName?: string;
    isArray: boolean;
}
export interface ModelUsage {
    modelName: string;
    usageCount: number;
    usageLocations: ModelUsageLocation[];
    fieldsUsed: string[];
    relationsUsed: string[];
    operationsUsed: DatabaseOperation[];
}
export interface ModelUsageLocation {
    filePath: string;
    lineNumber: number;
    context: string;
    operation: DatabaseOperation;
}
export interface DatabaseOperation {
    type: 'create' | 'findMany' | 'findUnique' | 'findFirst' | 'update' | 'updateMany' | 'delete' | 'deleteMany' | 'upsert' | 'count' | 'aggregate' | 'groupBy';
    modelName: string;
    fields?: string[];
    includes?: string[];
    where?: string[];
}
export interface DatabaseAccessPattern {
    pattern: string;
    frequency: number;
    locations: string[];
    performance: 'efficient' | 'moderate' | 'inefficient';
    recommendation?: string;
}
export interface UnusedDatabaseElement {
    type: 'model' | 'field' | 'relation' | 'enum';
    name: string;
    modelName?: string;
    location: string;
    reason: string;
}
export interface DatabaseModelUsageReport {
    schemas: PrismaModel[];
    modelUsage: ModelUsage[];
    unusedElements: UnusedDatabaseElement[];
    accessPatterns: DatabaseAccessPattern[];
    optimizationOpportunities: {
        missingIndexes: string[];
        inefficientQueries: string[];
        unusedIncludes: string[];
        nPlusOneQueries: string[];
    };
    summary: {
        totalModels: number;
        usedModels: number;
        unusedModels: number;
        totalFields: number;
        usedFields: number;
        unusedFields: number;
        totalRelations: number;
        usedRelations: number;
        unusedRelations: number;
        usageEfficiency: number;
    };
}
export declare class DatabaseModelUsageAnalyzer {
    private packages;
    private rootPath;
    constructor(packages: PackageInfo[], rootPath: string);
    analyzeDatabaseModelUsage(): Promise<DatabaseModelUsageReport>;
    private parsePrismaSchemas;
    private parseSchemaContent;
    private parseField;
    private isRelationField;
    private parseRelation;
    private scanModelUsage;
    private scanFileForModelUsage;
    private extractFieldUsage;
    private identifyUnusedElements;
    private analyzeAccessPatterns;
    private assessPatternPerformance;
    private getPatternRecommendation;
    private identifyOptimizationOpportunities;
    private generateSummary;
}
//# sourceMappingURL=DatabaseModelUsageAnalyzer.d.ts.map