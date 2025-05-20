import fs from 'fs/promises';
import path from 'path';
import { z, ZodObject, ZodOptional, ZodString } from 'zod';
import { Dirent } from 'fs'; // Import Dirent type
import { exec } from 'child_process'; // For runBuild tool
import { promisify } from 'util'; // To promisify exec
const execPromise = promisify(exec);

// --- Interfaces (can be moved to a shared types.ts file) ---
interface Logger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string, error?: any) => void;
}

interface ToolContext {
  agentId: string;
  workspaceRoot: string;
  logger: Logger;
}

interface FileEntry {
  name: string;
  isDirectory: boolean;
}

// --- Helper Function ---

/**
 * Safely resolves a relative path within the workspace root.
 * Throws an error if the path attempts to traverse outside the root.
 */
const resolveWorkspacePath = (workspaceRoot: string, relativePath: string): string => {
  const absolutePath = path.resolve(workspaceRoot, relativePath);
  // Security check: Ensure the resolved path is still within the workspace root
  if (!absolutePath.startsWith(workspaceRoot)) {
    throw new Error(`Path traversal detected: ${relativePath} resolves outside workspace.`);
  }
  return absolutePath;
};

// --- Zod Schemas for Parameters ---

const FilePathSchema: ZodString = z.string().describe('Relative path within the workspace');
// Correct the type annotation to match the Zod type after .default()
const DirectoryPathSchemaBase = z.string().optional().describe('Relative path to directory');
const DirectoryPathSchema = DirectoryPathSchemaBase.default('.');

// Add schema for writeFile
const ContentSchema = z.string().describe('Content to write to the file');
// Don't use .default() to avoid the type mismatch, instead handle defaults in the implementation
const WriteFileSchema = z.object({
  filePath: FilePathSchema,
  content: ContentSchema,
  createDirs: z.boolean().optional().describe('Create parent directories if they don\'t exist')
});

// Add schema for runBuild
const BuildScriptSchema = z.string().describe('Name of the build script to run (e.g., "build:ui", "build:core")');
// Don't use .default() to avoid the type mismatch, instead handle defaults in the implementation
const RunBuildSchema = z.object({
  script: BuildScriptSchema,
  timeout: z.number().optional().describe('Maximum execution time in milliseconds')
});

// Define specific parameter types from schemas
type ReadFileParams = z.infer<typeof readFileSchema>;
type ListWorkspaceFilesParams = z.infer<typeof listWorkspaceFilesSchema>;
type WriteFileParams = z.infer<typeof WriteFileSchema>;
type RunBuildParams = z.infer<typeof RunBuildSchema>;

// --- Tool Implementations ---

export const fileTools = {
  /**
   * Reads the content of a file.
   */
  readFile: async (params: ReadFileParams, context: ToolContext): Promise<{ content: string }> => {
    const { filePath } = params; // Params are already validated by MCPServer
    const { workspaceRoot, logger, agentId } = context;
    logger.info(`[readFile] Agent ${agentId} requested to read: ${filePath}`);
    try {
      const absolutePath = resolveWorkspacePath(workspaceRoot, filePath);
      const content: string = await fs.readFile(absolutePath, 'utf-8');
      logger.info(`[readFile] Successfully read ${filePath}`);
      return { content };
    } catch (error: any) { // Catch as 'any' or 'unknown' and check type
      logger.error(`[readFile] Error reading ${filePath}:`, error);
      if (error.code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      }
      throw new Error(`Failed to read file: ${error.message || 'Unknown error'}`);
    }
  },

  /**
   * Lists files and directories within a given path.
   */
  listWorkspaceFiles: async (params: ListWorkspaceFilesParams, context: ToolContext): Promise<{ files: FileEntry[] }> => {
    // Ensure directoryPath is a string (it has a default value from the schema)
    const directoryPath = params.directoryPath ?? '.'; // Use nullish coalescing for safety
    const { workspaceRoot, logger, agentId } = context;
    logger.info(`[listWorkspaceFiles] Agent ${agentId} requested listing for: ${directoryPath}`);
    try {
      // Now directoryPath is guaranteed to be a string
      const absolutePath = resolveWorkspacePath(workspaceRoot, directoryPath);
      const entries: Dirent[] = await fs.readdir(absolutePath, { withFileTypes: true });
      const files: FileEntry[] = entries.map((entry: Dirent) => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
      }));
      logger.info(`[listWorkspaceFiles] Successfully listed ${directoryPath}`);
      return { files };
    } catch (error: any) { // Catch as 'any' or 'unknown' and check type
      logger.error(`[listWorkspaceFiles] Error listing ${directoryPath}:`, error);
      if (error.code === 'ENOENT') {
        throw new Error(`Directory not found: ${directoryPath}`);
      }
      throw new Error(`Failed to list directory: ${error.message || 'Unknown error'}`);
    }
  },

  /**
   * Writes content to a file.
   */
  writeFile: async (params: WriteFileParams, context: ToolContext): Promise<{ success: boolean, filePath: string }> => {
    const { filePath, content } = params;
    // Handle default value here instead of in the schema
    const createDirs = params.createDirs ?? false;
    const { workspaceRoot, logger, agentId } = context;
    logger.info(`[writeFile] Agent ${agentId} requested to write to: ${filePath}`);
    
    try {
      const absolutePath = resolveWorkspacePath(workspaceRoot, filePath);
      
      // Create parent directories if needed and requested
      if (createDirs) {
        const dirPath = path.dirname(absolutePath);
        await fs.mkdir(dirPath, { recursive: true });
        logger.info(`[writeFile] Created parent directories for ${filePath}`);
      }
      
      await fs.writeFile(absolutePath, content, 'utf-8');
      logger.info(`[writeFile] Successfully wrote to ${filePath}`);
      return { success: true, filePath };
    } catch (error: any) {
      logger.error(`[writeFile] Error writing to ${filePath}:`, error);
      if (error.code === 'ENOENT' && !createDirs) {
        throw new Error(`Directory does not exist for file: ${filePath}. Use createDirs: true to create directories.`);
      }
      throw new Error(`Failed to write file: ${error.message || 'Unknown error'}`);
    }
  },
};

// Build tools for running scripts
export const buildTools = {
  /**
   * Runs a build script defined in package.json.
   */
  runBuild: async (params: RunBuildParams, context: ToolContext): Promise<{ success: boolean, output: string }> => {
    const { script } = params;
    // Handle default value here instead of in the schema
    const timeout = params.timeout ?? 60000;
    const { workspaceRoot, logger, agentId } = context;
    logger.info(`[runBuild] Agent ${agentId} requested to run build script: ${script}`);

    try {
      // Check if script exists in package.json first
      const pkgJsonPath = path.join(workspaceRoot, 'package.json');
      const pkgJsonContent = await fs.readFile(pkgJsonPath, 'utf-8');
      const pkgJson = JSON.parse(pkgJsonContent);
      
      if (!pkgJson.scripts || !pkgJson.scripts[script]) {
        throw new Error(`Build script '${script}' not found in package.json`);
      }

      // Execute the script with a timeout
      const command = `cd "${workspaceRoot}" && yarn ${script}`;
      logger.info(`[runBuild] Executing command: ${command}`);
      
      const { stdout, stderr } = await Promise.race([
        execPromise(command),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Build script '${script}' timed out after ${timeout}ms`)), timeout);
        })
      ]);

      // Log output for debugging
      if (stdout) logger.info(`[runBuild] Command output: ${stdout}`);
      if (stderr) logger.warn(`[runBuild] Command stderr: ${stderr}`);
      
      return { 
        success: true, 
        output: stdout + (stderr ? `\nWarnings/Errors:\n${stderr}` : '') 
      };
    } catch (error: any) {
      logger.error(`[runBuild] Error running build script ${script}:`, error);
      return { 
        success: false, 
        output: error.message || 'Unknown error running build script' 
      };
    }
  }
};

// --- Export Schemas for Registration (used in server.ts) ---

export const readFileSchema: ZodObject<{ filePath: ZodString }> = z.object({
  filePath: FilePathSchema,
});

export const listWorkspaceFilesSchema: ZodObject<{ directoryPath: ZodOptional<ZodString> }> = z.object({
  // Use the base schema here before the default is applied for the object definition
  directoryPath: DirectoryPathSchemaBase,
});

export const writeFileSchema: ZodObject<{
  filePath: ZodString,
  content: ZodString,
  createDirs: ZodOptional<z.ZodBoolean>
}> = WriteFileSchema;

export const runBuildSchema: ZodObject<{
  script: ZodString,
  timeout: ZodOptional<z.ZodNumber>
}> = RunBuildSchema;

// --- Define and Export Schemas for other tools if implemented ---
// export const writeFileSchema = z.object({ ... });
// export const runBuildSchema = z.object({ ... });
// export const runTestSchema = z.object({ ... });
