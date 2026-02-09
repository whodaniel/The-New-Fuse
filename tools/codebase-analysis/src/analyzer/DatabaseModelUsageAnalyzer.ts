import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import type { PackageInfo } from '../scanner/FileSystemScanner';

export interface PrismaModel {
  name: string;
  fields: PrismaField[];
  relations: PrismaRelation[];
  enums: string[];
  indexes: string[];
  location: string; // which schema file
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
  modelName?: string; // for fields and relations
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

export class DatabaseModelUsageAnalyzer {
  private packages: PackageInfo[];
  private rootPath: string;

  constructor(packages: PackageInfo[], rootPath: string) {
    this.packages = packages;
    this.rootPath = rootPath;
  }

  async analyzeDatabaseModelUsage(): Promise<DatabaseModelUsageReport> {
    console.log('Analyzing database model usage...');

    // Step 1: Parse all Prisma schemas
    const schemas = await this.parsePrismaSchemas();
    
    // Step 2: Scan codebase for database model usage
    const modelUsage = await this.scanModelUsage(schemas);
    
    // Step 3: Identify unused elements
    const unusedElements = this.identifyUnusedElements(schemas, modelUsage);
    
    // Step 4: Analyze access patterns
    const accessPatterns = this.analyzeAccessPatterns(modelUsage);
    
    // Step 5: Identify optimization opportunities
    const optimizationOpportunities = this.identifyOptimizationOpportunities(modelUsage, accessPatterns);
    
    // Step 6: Generate summary
    const summary = this.generateSummary(schemas, modelUsage, unusedElements);

    return {
      schemas,
      modelUsage,
      unusedElements,
      accessPatterns,
      optimizationOpportunities,
      summary
    };
  }

  private async parsePrismaSchemas(): Promise<PrismaModel[]> {
    const schemas: PrismaModel[] = [];
    
    // Find all Prisma schema files
    const schemaFiles = await glob('**/prisma/schema.prisma', {
      cwd: this.rootPath,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });

    for (const schemaFile of schemaFiles) {
      const fullPath = path.join(this.rootPath, schemaFile);
      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        const models = this.parseSchemaContent(content, schemaFile);
        schemas.push(...models);
      } catch (error) {
        console.warn(`Failed to parse schema ${schemaFile}:`, error);
      }
    }

    return schemas;
  }

  private parseSchemaContent(content: string, location: string): PrismaModel[] {
    const models: PrismaModel[] = [];
    const lines = content.split('\n');
    
    let currentModel: Partial<PrismaModel> | null = null;
    let inModel = false;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip comments and empty lines
      if (!line || line.startsWith('//') || line.startsWith('/*')) continue;
      
      // Model declaration
      if (line.startsWith('model ')) {
        const modelName = line.split(' ')[1];
        currentModel = {
          name: modelName,
          fields: [],
          relations: [],
          enums: [],
          indexes: [],
          location
        };
        inModel = true;
        braceCount = 0;
      }
      
      if (inModel && currentModel) {
        // Count braces to track model boundaries
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;
        
        // Parse field
        if (line.includes(' ') && !line.startsWith('@@') && !line.includes('{') && !line.includes('}')) {
          const field = this.parseField(line);
          if (field) {
            if (this.isRelationField(field)) {
              currentModel.relations!.push(this.parseRelation(field, line));
            } else {
              currentModel.fields!.push(field);
            }
          }
        }
        
        // Parse indexes
        if (line.startsWith('@@index') || line.startsWith('@@unique')) {
          currentModel.indexes!.push(line);
        }
        
        // End of model
        if (braceCount === 0 && line.includes('}')) {
          models.push(currentModel as PrismaModel);
          currentModel = null;
          inModel = false;
        }
      }
    }

    return models;
  }

  private parseField(line: string): PrismaField | null {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) return null;

    const name = parts[0];
    const typeInfo = parts[1];
    
    const isOptional = typeInfo.includes('?');
    const isArray = typeInfo.includes('[]');
    const baseType = typeInfo.replace(/[\?\[\]]/g, '');
    
    const attributes = parts.slice(2);
    const isId = attributes.some(attr => attr.includes('@id'));
    const isUnique = attributes.some(attr => attr.includes('@unique'));
    const hasDefault = attributes.some(attr => attr.includes('@default'));
    
    let defaultValue: string | undefined;
    const defaultAttr = attributes.find(attr => attr.includes('@default'));
    if (defaultAttr) {
      // Handle nested parentheses in default values like @default(uuid())
      const match = defaultAttr.match(/@default\((.+)\)$/);
      defaultValue = match ? match[1] : undefined;
    }

    return {
      name,
      type: baseType,
      isOptional,
      isArray,
      isId,
      isUnique,
      hasDefault,
      defaultValue,
      attributes
    };
  }

  private isRelationField(field: PrismaField): boolean {
    // Check if the field type is a custom type (likely a model)
    const primitiveTypes = ['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Decimal', 'Bytes'];
    return !primitiveTypes.includes(field.type) && !field.type.startsWith('enum');
  }

  private parseRelation(field: PrismaField, line: string): PrismaRelation {
    const relationMatch = line.match(/@relation\(([^)]+)\)/);
    let relationName: string | undefined;
    
    if (relationMatch) {
      const relationArgs = relationMatch[1];
      const nameMatch = relationArgs.match(/name:\s*"([^"]+)"/);
      relationName = nameMatch ? nameMatch[1] : undefined;
    }

    return {
      name: field.name,
      type: field.type,
      relatedModel: field.type,
      relationName,
      isArray: field.isArray
    };
  }

  private async scanModelUsage(schemas: PrismaModel[]): Promise<ModelUsage[]> {
    const modelUsage: ModelUsage[] = [];
    const modelNames = schemas.map(s => s.name);
    
    // Find all TypeScript/JavaScript files
    const sourceFiles = await glob('**/*.{ts,js,tsx,jsx}', {
      cwd: this.rootPath,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.d.ts']
    });

    for (const modelName of modelNames) {
      const usage: ModelUsage = {
        modelName,
        usageCount: 0,
        usageLocations: [],
        fieldsUsed: [],
        relationsUsed: [],
        operationsUsed: []
      };

      for (const sourceFile of sourceFiles) {
        const fullPath = path.join(this.rootPath, sourceFile);
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          const fileUsage = this.scanFileForModelUsage(content, modelName, sourceFile);
          
          usage.usageCount += fileUsage.usageCount;
          usage.usageLocations.push(...fileUsage.usageLocations);
          usage.fieldsUsed.push(...fileUsage.fieldsUsed);
          usage.relationsUsed.push(...fileUsage.relationsUsed);
          usage.operationsUsed.push(...fileUsage.operationsUsed);
        } catch (error) {
          console.warn(`Failed to scan file ${sourceFile}:`, error);
        }
      }

      // Remove duplicates
      usage.fieldsUsed = [...new Set(usage.fieldsUsed)];
      usage.relationsUsed = [...new Set(usage.relationsUsed)];
      
      modelUsage.push(usage);
    }

    return modelUsage;
  }

  private scanFileForModelUsage(content: string, modelName: string, filePath: string): ModelUsage {
    const usage: ModelUsage = {
      modelName,
      usageCount: 0,
      usageLocations: [],
      fieldsUsed: [],
      relationsUsed: [],
      operationsUsed: []
    };

    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      
      // Look for Prisma client operations
      const prismaOperations = [
        'create', 'findMany', 'findUnique', 'findFirst', 
        'update', 'updateMany', 'delete', 'deleteMany', 
        'upsert', 'count', 'aggregate', 'groupBy'
      ];
      
      for (const operation of prismaOperations) {
        const pattern = new RegExp(`\\b${modelName.toLowerCase()}\\.${operation}\\b`, 'i');
        if (pattern.test(line)) {
          usage.usageCount++;
          usage.usageLocations.push({
            filePath,
            lineNumber,
            context: line.trim(),
            operation: {
              type: operation as any,
              modelName
            }
          });
          
          usage.operationsUsed.push({
            type: operation as any,
            modelName
          });
          
          // Extract field usage from the operation
          const fieldUsage = this.extractFieldUsage(line, modelName);
          usage.fieldsUsed.push(...fieldUsage.fields);
          usage.relationsUsed.push(...fieldUsage.relations);
        }
      }
      
      // Look for direct model references
      if (line.includes(modelName) && !line.includes('//')) {
        usage.usageCount++;
        usage.usageLocations.push({
          filePath,
          lineNumber,
          context: line.trim(),
          operation: {
            type: 'findMany', // default assumption
            modelName
          }
        });
      }
    }

    return usage;
  }

  private extractFieldUsage(line: string, modelName: string): { fields: string[], relations: string[] } {
    const fields: string[] = [];
    const relations: string[] = [];
    
    // Extract select fields
    const selectMatch = line.match(/select:\s*{([^}]+)}/);
    if (selectMatch) {
      const selectContent = selectMatch[1];
      const selectFields = selectContent.split(',').map(f => {
        const fieldName = f.trim().split(':')[0].trim();
        return fieldName;
      }).filter(f => f && f !== 'true' && f !== 'false');
      fields.push(...selectFields);
    }
    
    // Extract include relations
    const includeMatch = line.match(/include:\s*{([^}]+)}/);
    if (includeMatch) {
      const includeContent = includeMatch[1];
      const includeFields = includeContent.split(',').map(f => {
        const fieldName = f.trim().split(':')[0].trim();
        return fieldName;
      }).filter(f => f && f !== 'true' && f !== 'false');
      relations.push(...includeFields);
    }
    
    // Extract where clause fields
    const whereMatch = line.match(/where:\s*{([^}]+)}/);
    if (whereMatch) {
      const whereContent = whereMatch[1];
      const whereFields = whereContent.split(',').map(f => {
        const fieldName = f.trim().split(':')[0].trim();
        return fieldName;
      }).filter(f => f && f !== '"' && f !== "'");
      fields.push(...whereFields);
    }

    return { fields, relations };
  }

  private identifyUnusedElements(schemas: PrismaModel[], modelUsage: ModelUsage[]): UnusedDatabaseElement[] {
    const unusedElements: UnusedDatabaseElement[] = [];
    
    for (const schema of schemas) {
      const usage = modelUsage.find(u => u.modelName === schema.name);
      
      // Check if model is unused
      if (!usage || usage.usageCount === 0) {
        unusedElements.push({
          type: 'model',
          name: schema.name,
          location: schema.location,
          reason: 'Model is not referenced in any code'
        });
        continue;
      }
      
      // Check for unused fields
      for (const field of schema.fields) {
        if (!usage.fieldsUsed.includes(field.name) && !field.isId) {
          unusedElements.push({
            type: 'field',
            name: field.name,
            modelName: schema.name,
            location: schema.location,
            reason: 'Field is never selected or used in queries'
          });
        }
      }
      
      // Check for unused relations
      for (const relation of schema.relations) {
        if (!usage.relationsUsed.includes(relation.name)) {
          unusedElements.push({
            type: 'relation',
            name: relation.name,
            modelName: schema.name,
            location: schema.location,
            reason: 'Relation is never included in queries'
          });
        }
      }
    }

    return unusedElements;
  }

  private analyzeAccessPatterns(modelUsage: ModelUsage[]): DatabaseAccessPattern[] {
    const patterns: DatabaseAccessPattern[] = [];
    const patternMap = new Map<string, { frequency: number, locations: string[] }>();
    
    for (const usage of modelUsage) {
      for (const operation of usage.operationsUsed) {
        const pattern = `${operation.modelName}.${operation.type}`;
        
        if (!patternMap.has(pattern)) {
          patternMap.set(pattern, { frequency: 0, locations: [] });
        }
        
        const patternData = patternMap.get(pattern)!;
        patternData.frequency++;
        
        // Add unique locations
        const newLocations = usage.usageLocations
          .filter(loc => loc.operation.type === operation.type)
          .map(loc => loc.filePath);
        
        for (const location of newLocations) {
          if (!patternData.locations.includes(location)) {
            patternData.locations.push(location);
          }
        }
      }
    }
    
    for (const [pattern, data] of patternMap) {
      const performance = this.assessPatternPerformance(pattern, data.frequency);
      const recommendation = this.getPatternRecommendation(pattern, performance);
      
      patterns.push({
        pattern,
        frequency: data.frequency,
        locations: data.locations,
        performance,
        recommendation
      });
    }
    
    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  private assessPatternPerformance(pattern: string, frequency: number): 'efficient' | 'moderate' | 'inefficient' {
    // Simple heuristics for performance assessment
    if (pattern.includes('findMany') && frequency > 10) {
      return 'inefficient'; // Potential N+1 queries
    }
    
    if (pattern.includes('findUnique') || pattern.includes('findFirst')) {
      return 'efficient';
    }
    
    if (frequency > 50) {
      return 'moderate'; // High frequency might indicate optimization opportunities
    }
    
    return 'efficient';
  }

  private getPatternRecommendation(pattern: string, performance: 'efficient' | 'moderate' | 'inefficient'): string | undefined {
    if (performance === 'inefficient') {
      if (pattern.includes('findMany')) {
        return 'Consider using pagination, filtering, or batch operations to reduce query load';
      }
    }
    
    if (performance === 'moderate') {
      return 'Consider caching frequently accessed data or optimizing query patterns';
    }
    
    return undefined;
  }

  private identifyOptimizationOpportunities(modelUsage: ModelUsage[], accessPatterns: DatabaseAccessPattern[]): {
    missingIndexes: string[];
    inefficientQueries: string[];
    unusedIncludes: string[];
    nPlusOneQueries: string[];
  } {
    const missingIndexes: string[] = [];
    const inefficientQueries: string[] = [];
    const unusedIncludes: string[] = [];
    const nPlusOneQueries: string[] = [];
    
    // Identify potential missing indexes
    for (const usage of modelUsage) {
      const whereFields = usage.fieldsUsed.filter(field => 
        usage.usageLocations.some(loc => loc.context.includes(`where`) && loc.context.includes(field))
      );
      
      for (const field of whereFields) {
        if (usage.usageCount > 10) { // High usage threshold
          missingIndexes.push(`Consider adding index on ${usage.modelName}.${field}`);
        }
      }
    }
    
    // Identify inefficient queries
    for (const pattern of accessPatterns) {
      if (pattern.performance === 'inefficient') {
        inefficientQueries.push(`${pattern.pattern} used ${pattern.frequency} times - ${pattern.recommendation}`);
      }
    }
    
    // Identify potential N+1 queries
    const findManyPatterns = accessPatterns.filter(p => p.pattern.includes('findMany'));
    for (const pattern of findManyPatterns) {
      if (pattern.frequency > 20) {
        nPlusOneQueries.push(`Potential N+1 query pattern: ${pattern.pattern}`);
      }
    }

    return {
      missingIndexes,
      inefficientQueries,
      unusedIncludes,
      nPlusOneQueries
    };
  }

  private generateSummary(schemas: PrismaModel[], modelUsage: ModelUsage[], unusedElements: UnusedDatabaseElement[]): {
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
  } {
    const totalModels = schemas.length;
    const usedModels = modelUsage.filter(u => u.usageCount > 0).length;
    const unusedModels = totalModels - usedModels;
    
    const totalFields = schemas.reduce((sum, s) => sum + s.fields.length, 0);
    const usedFields = modelUsage.reduce((sum, u) => sum + u.fieldsUsed.length, 0);
    const unusedFields = unusedElements.filter(e => e.type === 'field').length;
    
    const totalRelations = schemas.reduce((sum, s) => sum + s.relations.length, 0);
    const usedRelations = modelUsage.reduce((sum, u) => sum + u.relationsUsed.length, 0);
    const unusedRelations = unusedElements.filter(e => e.type === 'relation').length;
    
    const usageEfficiency = Math.round(((usedModels + usedFields + usedRelations) / (totalModels + totalFields + totalRelations)) * 100);

    return {
      totalModels,
      usedModels,
      unusedModels,
      totalFields,
      usedFields,
      unusedFields,
      totalRelations,
      usedRelations,
      unusedRelations,
      usageEfficiency
    };
  }
}