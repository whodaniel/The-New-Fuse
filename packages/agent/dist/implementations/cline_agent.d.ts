/**
 * Cline Agent Implementation
 * A CLI-focused agent inspired by the Cline VSCode extension
 * Specializes in file operations, code generation, and terminal command execution
 */
import { IAgent } from '../interfaces/IAgent.js';
export interface ClineConfig {
    agentId: string;
    name: string;
    workspaceRoot?: string;
    allowedCommands?: string[];
    maxFileSize?: number;
    autoFormat?: boolean;
}
export interface FileOperation {
    type: 'read' | 'write' | 'create' | 'delete' | 'move' | 'copy';
    path: string;
    content?: string;
    destination?: string;
}
export interface CommandExecution {
    command: string;
    args?: string[];
    cwd?: string;
    timeout?: number;
}
export interface CodeGeneration {
    description: string;
    language: string;
    template?: string;
    outputPath?: string;
}
export interface ClineResult {
    success: boolean;
    operation: string;
    output?: string;
    error?: string;
    files?: string[];
    duration: number;
}
export declare class ClineAgent implements IAgent {
    readonly id: string;
    readonly name: string;
    readonly type = "cline";
    readonly capabilities: string[];
    private config;
    private memory;
    private state;
    private isInitialized;
    private commandHistory;
    private fileOperationHistory;
    constructor(config: ClineConfig);
    initialize(): Promise<void>;
    process(message: any): Promise<any>;
    learn(data: unknown): Promise<void>;
    saveToMemory(key: string, value: unknown): Promise<void>;
    retrieveFromMemory(key: string): Promise<any>;
    getState(): Promise<any>;
    setState(state: unknown): Promise<void>;
    sendMessage(message: any): Promise<void>;
    receiveMessage(message: any): Promise<void>;
    handleError(error: Error): Promise<void>;
    readFile(path: string): Promise<ClineResult>;
    writeFile(path: string, content: string): Promise<ClineResult>;
    createFile(path: string, content?: string): Promise<ClineResult>;
    deleteFile(path: string): Promise<ClineResult>;
    listDirectory(path?: string): Promise<ClineResult>;
    executeCommand(command: string, args?: string[], cwd?: string): Promise<ClineResult>;
    generateCode(description: string, language: string, template?: string): Promise<ClineResult>;
    searchFiles(pattern: string, path?: string): Promise<ClineResult>;
    private resolvePath;
    private isCommandAllowed;
    private recordFileOperation;
    private recordCommand;
}
export default ClineAgent;
//# sourceMappingURL=cline_agent.d.ts.map