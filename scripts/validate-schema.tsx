/**
 * Schema Validation Script
 * 
 * This script validates that the database schema is in sync with the application.
 * It compares the main Prisma schema with the one in the packages/database directory
 * and identifies any discrepancies.
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Paths to schema files
const ROOT_DIR = path.resolve(__dirname, '..');
const MAIN_SCHEMA_PATH = path.join(ROOT_DIR, 'prisma/schema.prisma');
const PACKAGE_SCHEMA_PATH = path.join(ROOT_DIR, 'packages/database/prisma/schema.prisma');

// Paths to migration directories
const MAIN_MIGRATIONS_PATH = path.join(ROOT_DIR, 'prisma/migrations');
const PACKAGE_MIGRATIONS_PATH = path.join(ROOT_DIR, 'packages/database/prisma/migrations');

// Function to read a schema file
async function readSchemaFile(filePath: string): Promise<string> {
  try {
    return await fs.promises.readFile(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading schema file at ${filePath}:`, error);
    throw error;
  }
}

// Function to parse models from schema content
function parseModels(schemaContent: string): Record<string, any> {
  const modelRegex = /model\s+(\w+)\s+\{([^}]*)\}/g;
  const enumRegex = /enum\s+(\w+)\s+\{([^}]*)\}/g;
  
  const models: Record<string, any> = {};
  const enums: Record<string, any> = {};
  
  // Parse models
  let match;
  while ((match = modelRegex.exec(schemaContent)) !== null) {
    const [, modelName, modelContent] = match;
    models[modelName] = parseModelContent(modelContent.trim());
  }
  
  // Parse enums
  while ((match = enumRegex.exec(schemaContent)) !== null) {
    const [, enumName, enumContent] = match;
    enums[enumName] = parseEnumContent(enumContent.trim());
  }
  
  return { models, enums };
}

// Function to parse model content
function parseModelContent(content: string): Record<string, string> {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//')); 
  const fields: Record<string, string> = {};
  
  for (const line of lines) {
    const fieldMatch = line.match(/^(\w+)\s+(.+)$/);
    if (fieldMatch) {
      const [, fieldName, fieldType] = fieldMatch;
      fields[fieldName] = fieldType;
    }
  }
  
  return fields;
}

// Function to parse enum content
function parseEnumContent(content: string): string[] {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('//'));
}

// Function to compare schemas
function compareSchemas(schema1: Record<string, any>, schema2: Record<string, any>): {
  missingModels: string[];
  missingEnums: string[];
  modelDifferences: Record<string, {
    missingFields: string[];
    typeDifferences: Record<string, { schema1: string; schema2: string }>;
  }>;
  enumDifferences: Record<string, {
    missingValues: string[];
  }>;
} {
  const result = {
    missingModels: [],
    missingEnums: [],
    modelDifferences: {},
    enumDifferences: {},
  };
  
  // Check for missing models in schema2
  for (const modelName of Object.keys(schema1.models)) {
    if (!schema2.models[modelName]) {
      result.missingModels.push(modelName);
    } else {
      // Compare model fields
      const model1Fields = schema1.models[modelName];
      const model2Fields = schema2.models[modelName];
      
      const missingFields = [];
      const typeDifferences: Record<string, { schema1: string; schema2: string }> = {};
      
      for (const fieldName of Object.keys(model1Fields)) {
        if (!model2Fields[fieldName]) {
          missingFields.push(fieldName);
        } else if (model1Fields[fieldName] !== model2Fields[fieldName]) {
          typeDifferences[fieldName] = {
            schema1: model1Fields[fieldName],
            schema2: model2Fields[fieldName],
          };
        }
      }
      
      if (missingFields.length > 0 || Object.keys(typeDifferences).length > 0) {
        result.modelDifferences[modelName] = {
          missingFields,
          typeDifferences,
        };
      }
    }
  }
  
  // Check for missing enums in schema2
  for (const enumName of Object.keys(schema1.enums)) {
    if (!schema2.enums[enumName]) {
      result.missingEnums.push(enumName);
    } else {
      // Compare enum values
      const enum1Values = schema1.enums[enumName];
      const enum2Values = schema2.enums[enumName];
      
      const missingValues = enum1Values.filter(value => !enum2Values.includes(value));
      
      if (missingValues.length > 0) {
        result.enumDifferences[enumName] = {
          missingValues,
        };
      }
    }
  }
  
  return result;
}

// Function to check for pending migrations
async function checkPendingMigrations(schemaPath: string, databaseUrl: string): Promise<boolean> {
  try {
    // Set the DATABASE_URL environment variable for this command
    const env = { ...process.env, DATABASE_URL: databaseUrl };
    
    // Run prisma migrate status to check for pending migrations
    const { stdout } = await execAsync('npx prisma migrate status --schema ' + schemaPath, { env });
    
    // Check if there are pending migrations
    return stdout.includes('Database schema is not in sync with migrations');
  } catch (error) {
    console.error('Error checking pending migrations:', error);
    return true; // Assume there are pending migrations if there's an error
  }
}

// Main function
async function validateSchema(): Promise<void> {
  try {

    // Read schema files
    const mainSchema = await readSchemaFile(MAIN_SCHEMA_PATH);
    const packageSchema = await readSchemaFile(PACKAGE_SCHEMA_PATH);
    
    // Parse schemas
    const parsedMainSchema = parseModels(mainSchema);
    const parsedPackageSchema = parseModels(packageSchema);
    
    // Compare schemas

    // Compare main schema with package schema
    const mainToPackage = compareSchemas(parsedMainSchema, parsedPackageSchema);
    
    if (
      mainToPackage.missingModels.length === 0 &&
      mainToPackage.missingEnums.length === 0 &&
      Object.keys(mainToPackage.modelDifferences).length === 0 &&
      Object.keys(mainToPackage.enumDifferences).length === 0
    ) {
      
    } else {

      if (mainToPackage.missingModels.length > 0) {
        }`);
      }
      
      if (mainToPackage.missingEnums.length > 0) {
        }`);
      }
      
      if (Object.keys(mainToPackage.modelDifferences).length > 0) {
        
        for (const [modelName, diff] of Object.entries(mainToPackage.modelDifferences)) {

          if (diff.missingFields.length > 0) {
            }`);
          }
          
          if (Object.keys(diff.typeDifferences).length > 0) {
            
            for (const [fieldName, typeDiff] of Object.entries(diff.typeDifferences)) {
              
            }
          }
        }
      }
      
      if (Object.keys(mainToPackage.enumDifferences).length > 0) {
        
        for (const [enumName, diff] of Object.entries(mainToPackage.enumDifferences)) {
          
          }`);
        }
      }
    }
    
    // Compare package schema with main schema
    const packageToMain = compareSchemas(parsedPackageSchema, parsedMainSchema);
    
    if (
      packageToMain.missingModels.length === 0 &&
      packageToMain.missingEnums.length === 0 &&
      Object.keys(packageToMain.modelDifferences).length === 0 &&
      Object.keys(packageToMain.enumDifferences).length === 0
    ) {
      
    } else {

      if (packageToMain.missingModels.length > 0) {
        }`);
      }
      
      if (packageToMain.missingEnums.length > 0) {
        }`);
      }
      
      if (Object.keys(packageToMain.modelDifferences).length > 0) {
        
        for (const [modelName, diff] of Object.entries(packageToMain.modelDifferences)) {

          if (diff.missingFields.length > 0) {
            }`);
          }
          
          if (Object.keys(diff.typeDifferences).length > 0) {
            
            for (const [fieldName, typeDiff] of Object.entries(diff.typeDifferences)) {
              
            }
          }
        }
      }
      
      if (Object.keys(packageToMain.enumDifferences).length > 0) {
        
        for (const [enumName, diff] of Object.entries(packageToMain.enumDifferences)) {
          
          }`);
        }
      }
    }
    
    // Check for pending migrations

    // Get database URL from .env file
    const envPath = path.join(ROOT_DIR, '.env');
    const envContent = await fs.promises.readFile(envPath, 'utf8');
    const databaseUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/); 
    
    if (!databaseUrlMatch) {
      throw new Error('DATABASE_URL not found in .env file');
    }
    
    const databaseUrl = databaseUrlMatch[1];
    
    // Check main schema
    const mainPending = await checkPendingMigrations(MAIN_SCHEMA_PATH, databaseUrl);

    // Check package schema
    const packagePending = await checkPendingMigrations(PACKAGE_SCHEMA_PATH, databaseUrl);

    // Print summary
    
    if (
      mainToPackage.missingModels.length === 0 &&
      mainToPackage.missingEnums.length === 0 &&
      Object.keys(mainToPackage.modelDifferences).length === 0 &&
      Object.keys(mainToPackage.enumDifferences).length === 0 &&
      packageToMain.missingModels.length === 0 &&
      packageToMain.missingEnums.length === 0 &&
      Object.keys(packageToMain.modelDifferences).length === 0 &&
      Object.keys(packageToMain.enumDifferences).length === 0 &&
      !mainPending &&
      !packagePending
    ) {
      
    } else {

      if (
        mainToPackage.missingModels.length > 0 ||
        mainToPackage.missingEnums.length > 0 ||
        Object.keys(mainToPackage.modelDifferences).length > 0 ||
        Object.keys(mainToPackage.enumDifferences).length > 0
      ) {

      }
      
      if (
        packageToMain.missingModels.length > 0 ||
        packageToMain.missingEnums.length > 0 ||
        Object.keys(packageToMain.modelDifferences).length > 0 ||
        Object.keys(packageToMain.enumDifferences).length > 0
      ) {

      }
      
      if (mainPending) {

      }
      
      if (packagePending) {

      }

    }
  } catch (error) {
    console.error('Error validating schema:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the validation
validateSchema().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});