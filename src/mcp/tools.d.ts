import { z, ZodObject, ZodOptional, ZodString } from 'zod';
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
declare const WriteFileSchema: z.ZodObject<{
    filePath: z.ZodString;
    content: z.ZodString;
    createDirs: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
declare const RunBuildSchema: z.ZodObject<{
    script: z.ZodString;
    timeout: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
type ReadFileParams = z.infer<typeof readFileSchema>;
type ListWorkspaceFilesParams = z.infer<typeof listWorkspaceFilesSchema>;
type WriteFileParams = z.infer<typeof WriteFileSchema>;
type RunBuildParams = z.infer<typeof RunBuildSchema>;
export declare const fileTools: {
    /**
     * Reads the content of a file.
     */
    readFile: (params: ReadFileParams, context: ToolContext) => Promise<{
        content: string;
    }>;
    /**
     * Lists files and directories within a given path.
     */
    listWorkspaceFiles: (params: ListWorkspaceFilesParams, context: ToolContext) => Promise<{
        files: FileEntry[];
    }>;
    /**
     * Writes content to a file.
     */
    writeFile: (params: WriteFileParams, context: ToolContext) => Promise<{
        success: boolean;
        filePath: string;
    }>;
};
export declare const buildTools: {
    /**
     * Runs a build script defined in package.json.
     */
    runBuild: (params: RunBuildParams, context: ToolContext) => Promise<{
        success: boolean;
        output: string;
    }>;
};
export declare const readFileSchema: ZodObject<{
    filePath: ZodString;
}>;
export declare const listWorkspaceFilesSchema: ZodObject<{
    directoryPath: ZodOptional<ZodString>;
}>;
export declare const writeFileSchema: ZodObject<{
    filePath: ZodString;
    content: ZodString;
    createDirs: ZodOptional<z.ZodBoolean>;
}>;
export declare const runBuildSchema: ZodObject<{
    script: ZodString;
    timeout: ZodOptional<z.ZodNumber>;
}>;
export {};
//# sourceMappingURL=tools.d.ts.map