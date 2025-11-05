"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBuildSchema = exports.writeFileSchema = exports.listWorkspaceFilesSchema = exports.readFileSchema = exports.buildTools = exports.fileTools = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
const child_process_1 = require("child_process"); // For runBuild tool
const util_1 = require("util"); // To promisify exec
const execPromise = (0, util_1.promisify)(child_process_1.exec);
// --- Helper Function ---
/**
 * Safely resolves a relative path within the workspace root.
 * Throws an error if the path attempts to traverse outside the root.
 */
const resolveWorkspacePath = (workspaceRoot, relativePath) => {
    const absolutePath = path_1.default.resolve(workspaceRoot, relativePath);
    // Security check: Ensure the resolved path is still within the workspace root
    if (!absolutePath.startsWith(workspaceRoot)) {
        throw new Error(`Path traversal detected: ${relativePath} resolves outside workspace.`);
    }
    return absolutePath;
};
// --- Zod Schemas for Parameters ---
const FilePathSchema = zod_1.z.string().describe('Relative path within the workspace');
// Correct the type annotation to match the Zod type after .default()
const DirectoryPathSchemaBase = zod_1.z.string().optional().describe('Relative path to directory');
const DirectoryPathSchema = DirectoryPathSchemaBase.default('.');
// Add schema for writeFile
const ContentSchema = zod_1.z.string().describe('Content to write to the file');
// Don't use .default() to avoid the type mismatch, instead handle defaults in the implementation
const WriteFileSchema = zod_1.z.object({
    filePath: FilePathSchema,
    content: ContentSchema,
    createDirs: zod_1.z.boolean().optional().describe('Create parent directories if they don\'t exist')
});
// Add schema for runBuild
const BuildScriptSchema = zod_1.z.string().describe('Name of the build script to run (e.g., "build:ui", "build:core")');
// Don't use .default() to avoid the type mismatch, instead handle defaults in the implementation
const RunBuildSchema = zod_1.z.object({
    script: BuildScriptSchema,
    timeout: zod_1.z.number().optional().describe('Maximum execution time in milliseconds')
});
// --- Tool Implementations ---
exports.fileTools = {
    /**
     * Reads the content of a file.
     */
    readFile: async (params, context) => {
        const { filePath } = params; // Params are already validated by MCPServer
        const { workspaceRoot, logger, agentId } = context;
        logger.info(`[readFile] Agent ${agentId} requested to read: ${filePath}`);
        try {
            const absolutePath = resolveWorkspacePath(workspaceRoot, filePath);
            const content = await promises_1.default.readFile(absolutePath, 'utf-8');
            logger.info(`[readFile] Successfully read ${filePath}`);
            return { content };
        }
        catch (error) { // Catch as 'any' or 'unknown' and check type logger.error(`[readFile] Error reading ${filePath}:`, error);
            if (error.code === 'ENOENT') {
                throw new Error(`File not found: ${filePath}`);
            }
            throw new Error(`Failed to read file: ${error.message || 'Unknown error'}`);
        }
    },
    /**
     * Lists files and directories within a given path.
     */
    listWorkspaceFiles: async (params, context) => {
        // Ensure directoryPath is a string (it has a default value from the schema)
        const directoryPath = params.directoryPath ?? '.'; // Use nullish coalescing for safety
        const { workspaceRoot, logger, agentId } = context;
        logger.info(`[listWorkspaceFiles] Agent ${agentId} requested listing for: ${directoryPath}`);
        try {
            // Now directoryPath is guaranteed to be a string
            const absolutePath = resolveWorkspacePath(workspaceRoot, directoryPath);
            const entries = await promises_1.default.readdir(absolutePath, { withFileTypes: true });
            const files = entries.map((entry) => ({
                name: entry.name,
                isDirectory: entry.isDirectory(),
            }));
            logger.info(`[listWorkspaceFiles] Successfully listed ${directoryPath}`);
            return { files };
        }
        catch (error) { // Catch as 'any' or 'unknown' and check type logger.error(`[listWorkspaceFiles] Error listing ${directoryPath}:`, error);
            if (error.code === 'ENOENT') {
                throw new Error(`Directory not found: ${directoryPath}`);
            }
            throw new Error(`Failed to list directory: ${error.message || 'Unknown error'}`);
        }
    },
    /**
     * Writes content to a file.
     */
    writeFile: async (params, context) => {
        const { filePath, content } = params;
        // Handle default value here instead of in the schema
        const createDirs = params.createDirs ?? false;
        const { workspaceRoot, logger, agentId } = context;
        logger.info(`[writeFile] Agent ${agentId} requested to write to: ${filePath}`);
        try {
            const absolutePath = resolveWorkspacePath(workspaceRoot, filePath);
            // Create parent directories if needed and requested
            if (createDirs) {
                const dirPath = path_1.default.dirname(absolutePath);
                await promises_1.default.mkdir(dirPath, { recursive: true });
                logger.info(`[writeFile] Created parent directories for ${filePath}`);
            }
            await promises_1.default.writeFile(absolutePath, content, 'utf-8');
            logger.info(`[writeFile] Successfully wrote to ${filePath}`);
            return { success: true, filePath };
        }
        catch (error) {
            logger.error(`[writeFile] Error writing to ${filePath}:`, error);
            if (error.code === 'ENOENT' && !createDirs) {
                throw new Error(`Directory does not exist for file: ${filePath}. Use createDirs: true to create directories.`);
            }
            throw new Error(`Failed to write file: ${error.message || 'Unknown error'}`);
        }
    },
};
// Build tools for running scripts
exports.buildTools = {
    /**
     * Runs a build script defined in package.json.
     */
    runBuild: async (params, context) => {
        const { script } = params;
        // Handle default value here instead of in the schema
        const timeout = params.timeout ?? 60000;
        const { workspaceRoot, logger, agentId } = context;
        logger.info(`[runBuild] Agent ${agentId} requested to run build script: ${script}`);
        try {
            // Check if script exists in package.json first
            const pkgJsonPath = path_1.default.join(workspaceRoot, 'package.json');
            const pkgJsonContent = await promises_1.default.readFile(pkgJsonPath, 'utf-8');
            const pkgJson = JSON.parse(pkgJsonContent);
            if (!pkgJson.scripts || !pkgJson.scripts[script]) {
                throw new Error(`Build script '${script}' not found in package.json`);
            }
            // Execute the script with a timeout const command = `cd "${workspaceRoot}" && pnpm ${script}`; logger.info(`[runBuild] Executing command: ${command}`);
            const { stdout, stderr } = await Promise.race([
                execPromise(command),
                new Promise((_, reject) => {
                    setTimeout(() => reject(new Error(`Build script '${script}' timed out after ${timeout}ms`)), timeout);
                })
            ]);
            // Log output for debugging if (stdout) logger.info(`[runBuild] Command output: ${stdout}`); if (stderr) logger.warn(`[runBuild] Command stderr: ${stderr}`);
            return {
                success: true, output: stdout + (stderr ? `\nWarnings/Errors:\n${stderr}` : '')
            };
        }
        catch (error) {
            logger.error(`[runBuild] Error running build script ${script}:`, error);
            return {
                success: false,
                output: error.message || 'Unknown error running build script'
            };
        }
    }
};
// --- Export Schemas for Registration (used in server.ts) ---
exports.readFileSchema = zod_1.z.object({
    filePath: FilePathSchema,
});
exports.listWorkspaceFilesSchema = zod_1.z.object({
    // Use the base schema here before the default is applied for the object definition
    directoryPath: DirectoryPathSchemaBase,
});
exports.writeFileSchema = WriteFileSchema;
exports.runBuildSchema = RunBuildSchema;
// --- Define and Export Schemas for other tools if implemented ---
// export const writeFileSchema = z.object({ ... });
// export const runBuildSchema = z.object({ ... });
// export const runTestSchema = z.object({ ... });
//# sourceMappingURL=tools.js.map