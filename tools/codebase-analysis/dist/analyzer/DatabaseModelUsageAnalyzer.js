"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModelUsageAnalyzer = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const glob_1 = require("glob");
class DatabaseModelUsageAnalyzer {
    constructor(packages, rootPath) {
        this.packages = packages;
        this.rootPath = rootPath;
    }
    async analyzeDatabaseModelUsage() {
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
    async parsePrismaSchemas() {
        const schemas = [];
        // Find all Prisma schema files
        const schemaFiles = await (0, glob_1.glob)('**/prisma/schema.prisma', {
            cwd: this.rootPath,
            ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
        });
        for (const schemaFile of schemaFiles) {
            const fullPath = path.join(this.rootPath, schemaFile);
            try {
                const content = await fs.readFile(fullPath, 'utf-8');
                const models = this.parseSchemaContent(content, schemaFile);
                schemas.push(...models);
            }
            catch (error) {
                console.warn(`Failed to parse schema ${schemaFile}:`, error);
            }
        }
        return schemas;
    }
    parseSchemaContent(content, location) {
        const models = [];
        const lines = content.split('\n');
        let currentModel = null;
        let inModel = false;
        let braceCount = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // Skip comments and empty lines
            if (!line || line.startsWith('//') || line.startsWith('/*'))
                continue;
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
                            currentModel.relations.push(this.parseRelation(field, line));
                        }
                        else {
                            currentModel.fields.push(field);
                        }
                    }
                }
                // Parse indexes
                if (line.startsWith('@@index') || line.startsWith('@@unique')) {
                    currentModel.indexes.push(line);
                }
                // End of model
                if (braceCount === 0 && line.includes('}')) {
                    models.push(currentModel);
                    currentModel = null;
                    inModel = false;
                }
            }
        }
        return models;
    }
    parseField(line) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 2)
            return null;
        const name = parts[0];
        const typeInfo = parts[1];
        const isOptional = typeInfo.includes('?');
        const isArray = typeInfo.includes('[]');
        const baseType = typeInfo.replace(/[\?\[\]]/g, '');
        const attributes = parts.slice(2);
        const isId = attributes.some(attr => attr.includes('@id'));
        const isUnique = attributes.some(attr => attr.includes('@unique'));
        const hasDefault = attributes.some(attr => attr.includes('@default'));
        let defaultValue;
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
    isRelationField(field) {
        // Check if the field type is a custom type (likely a model)
        const primitiveTypes = ['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Decimal', 'Bytes'];
        return !primitiveTypes.includes(field.type) && !field.type.startsWith('enum');
    }
    parseRelation(field, line) {
        const relationMatch = line.match(/@relation\(([^)]+)\)/);
        let relationName;
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
    async scanModelUsage(schemas) {
        const modelUsage = [];
        const modelNames = schemas.map(s => s.name);
        // Find all TypeScript/JavaScript files
        const sourceFiles = await (0, glob_1.glob)('**/*.{ts,js,tsx,jsx}', {
            cwd: this.rootPath,
            ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.d.ts']
        });
        for (const modelName of modelNames) {
            const usage = {
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
                }
                catch (error) {
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
    scanFileForModelUsage(content, modelName, filePath) {
        const usage = {
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
                            type: operation,
                            modelName
                        }
                    });
                    usage.operationsUsed.push({
                        type: operation,
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
    extractFieldUsage(line, modelName) {
        const fields = [];
        const relations = [];
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
    identifyUnusedElements(schemas, modelUsage) {
        const unusedElements = [];
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
    analyzeAccessPatterns(modelUsage) {
        const patterns = [];
        const patternMap = new Map();
        for (const usage of modelUsage) {
            for (const operation of usage.operationsUsed) {
                const pattern = `${operation.modelName}.${operation.type}`;
                if (!patternMap.has(pattern)) {
                    patternMap.set(pattern, { frequency: 0, locations: [] });
                }
                const patternData = patternMap.get(pattern);
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
    assessPatternPerformance(pattern, frequency) {
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
    getPatternRecommendation(pattern, performance) {
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
    identifyOptimizationOpportunities(modelUsage, accessPatterns) {
        const missingIndexes = [];
        const inefficientQueries = [];
        const unusedIncludes = [];
        const nPlusOneQueries = [];
        // Identify potential missing indexes
        for (const usage of modelUsage) {
            const whereFields = usage.fieldsUsed.filter(field => usage.usageLocations.some(loc => loc.context.includes(`where`) && loc.context.includes(field)));
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
    generateSummary(schemas, modelUsage, unusedElements) {
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
exports.DatabaseModelUsageAnalyzer = DatabaseModelUsageAnalyzer;
//# sourceMappingURL=DatabaseModelUsageAnalyzer.js.map