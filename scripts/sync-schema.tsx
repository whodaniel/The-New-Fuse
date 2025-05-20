/**
 * Schema Synchronization Script
 * 
 * This script synchronizes the database schemas between the main prisma directory
 * and the packages/database directory to ensure they are in sync.
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

// Function to read a schema file
async function readSchemaFile(filePath: string): Promise<string> {
  try {
    return await fs.promises.readFile(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading schema file at ${filePath}:`, error);
    throw error;
  }
}

// Function to write a schema file
async function writeSchemaFile(filePath: string, content: string): Promise<void> {
  try {
    await fs.promises.writeFile(filePath, content, 'utf8');
    
  } catch (error) {
    console.error(`Error writing schema file at ${filePath}:`, error);
    throw error;
  }
}

// Function to backup a schema file
async function backupSchemaFile(filePath: string): Promise<string> {
  const backupDir = path.join(ROOT_DIR, 'backups/prisma_schemas_' + new Date().toISOString().replace(/[:.]/g, '').slice(0, 14));
  const fileName = path.basename(filePath);
  const backupPath = path.join(backupDir, fileName);
  
  try {
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      await fs.promises.mkdir(backupDir, { recursive: true });
    }
    
    // Copy the file to the backup directory
    await fs.promises.copyFile(filePath, backupPath);

    return backupPath;
  } catch (error) {
    console.error(`Error backing up schema file at ${filePath}:`, error);
    throw error;
  }
}

// Function to run Prisma commands
async function runPrismaCommand(command: string, schemaPath: string): Promise<string> {
  try {
    // Get database URL from .env file
    const envPath = path.join(ROOT_DIR, '.env');
    const envContent = await fs.promises.readFile(envPath, 'utf8');
    const databaseUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/); 
    
    if (!databaseUrlMatch) {
      throw new Error('DATABASE_URL not found in .env file');
    }
    
    const databaseUrl = databaseUrlMatch[1];
    
    // Set the DATABASE_URL environment variable for this command
    const env = { ...process.env, DATABASE_URL: databaseUrl };
    
    // Run the Prisma command
    const { stdout } = await execAsync(`npx prisma ${command} --schema ${schemaPath}`, { env });
    return stdout;
  } catch (error) {
    console.error(`Error running Prisma command '${command}' on schema ${schemaPath}:`, error);
    throw error;
  }
}

// Function to synchronize schemas
async function syncSchemas(direction: 'main-to-package' | 'package-to-main'): Promise<void> {
  try {
    // Determine source and target paths based on direction
    const sourcePath = direction === 'main-to-package' ? MAIN_SCHEMA_PATH : PACKAGE_SCHEMA_PATH;
    const targetPath = direction === 'main-to-package' ? PACKAGE_SCHEMA_PATH : MAIN_SCHEMA_PATH;
    
    // Read source schema
    
    const sourceSchema = await readSchemaFile(sourcePath);
    
    // Backup target schema
    
    await backupSchemaFile(targetPath);
    
    // Write source schema to target path
    
    await writeSchemaFile(targetPath, sourceSchema);

  } catch (error) {
    console.error('Error synchronizing schemas:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Function to apply pending migrations
async function applyMigrations(schemaPath: string): Promise<void> {
  try {
    
    const output = await runPrismaCommand('migrate deploy', schemaPath);

  } catch (error) {
    console.error('Error applying migrations:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Main function
async function main(): Promise<void> {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const direction = args[0] as 'main-to-package' | 'package-to-main' | undefined;
    const applyMigrationsFlag = args.includes('--apply-migrations');
    
    if (!direction || (direction !== 'main-to-package' && direction !== 'package-to-main')) {
      
      process.exit(1);
    }
    
    // Synchronize schemas
    await syncSchemas(direction);
    
    // Apply migrations if requested
    if (applyMigrationsFlag) {
      if (direction === 'main-to-package') {
        await applyMigrations(PACKAGE_SCHEMA_PATH);
      } else {
        await applyMigrations(MAIN_SCHEMA_PATH);
      }
    }

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Synchronization failed:', error);
  process.exit(1);
});