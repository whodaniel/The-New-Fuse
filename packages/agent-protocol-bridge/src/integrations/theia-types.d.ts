/**
 * Theia IDE Agentic Integration Types
 *
 * Comprehensive type definitions for Theia IDE integration
 * with The New Fuse AI Agent framework.
 */
import { NamedEntity, BaseEntity } from '../types/common-types';
export interface TheiaWorkspace extends NamedEntity {
    userId: string;
    rootPath: string;
    uri: string;
    settings?: Record<string, any>;
    extensions: string[];
    mcpEnabled: boolean;
    mcpServerUrl?: string;
    mcpConfig?: Record<string, any>;
    agentId?: string;
    aiEnabled: boolean;
    isActive: boolean;
    lastOpened?: Date;
}
export interface TheiaProject extends NamedEntity {
    workspaceId: string;
    userId: string;
    projectType: TheiaProjectType;
    rootPath: string;
    gitRepository?: string;
    gitBranch?: string;
    buildCommand?: string;
    runCommand?: string;
    testCommand?: string;
    language?: string;
    framework?: string;
    packageManager?: string;
    agentId?: string;
    automationLevel: TheiaAutomationLevel;
    isActive: boolean;
    lastAccessed?: Date;
}
export interface TheiaSession extends BaseEntity {
    workspaceId: string;
    sessionId: string;
    userId?: string;
    agentId?: string;
    connectionType: TheiaConnectionType;
    clientInfo?: Record<string, any>;
    status: TheiaSessionStatus;
    lastActivity: Date;
    endedAt?: Date;
    filesOpened: number;
    commandsExecuted: number;
}
export interface TheiaFile extends BaseEntity {
    projectId: string;
    relativePath: string;
    fileName: string;
    fileType: TheiaFileType;
    mimeType?: string;
    size?: bigint;
    encoding: string;
    permissions?: string;
    lastModified?: Date;
    checksum?: string;
    isWatched: boolean;
    watchedBy?: string;
}
export interface TheiaFileOperation {
    id: string;
    projectId: string;
    fileId?: string;
    operation: TheiaOperation;
    filePath: string;
    beforeContent?: string;
    afterContent?: string;
    diffContent?: string;
    triggeredBy: TheiaOperationTrigger;
    agentId?: string;
    userId?: string;
    status: TheiaOperationStatus;
    error?: string;
    executedAt: Date;
    duration?: number;
}
export declare enum TheiaProjectType {
    GENERAL = "GENERAL",
    NODEJS = "NODEJS",
    PYTHON = "PYTHON",
    REACT = "REACT",
    ANGULAR = "ANGULAR",
    VUE = "VUE",
    RUST = "RUST",
    GO = "GO",
    JAVA = "JAVA",
    CPP = "CPP",
    PHP = "PHP",
    RUBY = "RUBY"
}
export declare enum TheiaAutomationLevel {
    MANUAL = "MANUAL",
    ASSISTED = "ASSISTED",
    SEMI_AUTO = "SEMI_AUTO",
    FULL_AUTO = "FULL_AUTO"
}
export declare enum TheiaConnectionType {
    HTTP = "HTTP",
    WEBSOCKET = "WEBSOCKET",
    STDIO = "STDIO",
    SSH = "SSH"
}
export declare enum TheiaSessionStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    DISCONNECTED = "DISCONNECTED",
    EXPIRED = "EXPIRED"
}
export declare enum TheiaFileType {
    SOURCE_CODE = "SOURCE_CODE",
    CONFIG = "CONFIG",
    DATA = "DATA",
    DOCUMENTATION = "DOCUMENTATION",
    BINARY = "BINARY",
    UNKNOWN = "UNKNOWN"
}
export declare enum TheiaOperation {
    READ = "READ",
    WRITE = "WRITE",
    CREATE = "CREATE",
    DELETE = "DELETE",
    RENAME = "RENAME",
    MOVE = "MOVE",
    COPY = "COPY",
    CHMOD = "CHMOD"
}
export declare enum TheiaOperationTrigger {
    USER = "USER",
    AGENT = "AGENT",
    SYSTEM = "SYSTEM",
    EXTERNAL = "EXTERNAL"
}
export declare enum TheiaOperationStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
}
export interface TheiaAgentBridge {
    /**
     * Initialize Theia workspace
     */
    initializeWorkspace(workspaceConfig: Omit<TheiaWorkspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<TheiaWorkspace>;
    /**
     * Create new project in workspace
     */
    createProject(projectConfig: Omit<TheiaProject, 'id' | 'createdAt' | 'updatedAt'>): Promise<TheiaProject>;
    /**
     * Start Theia session
     */
    startSession(workspaceId: string, sessionConfig?: {
        userId?: string;
        agentId?: string;
        connectionType?: TheiaConnectionType;
        clientInfo?: Record<string, any>;
    }): Promise<TheiaSession>;
    /**
     * Execute file operation
     */
    executeFileOperation(projectId: string, operation: TheiaOperation, filePath: string, options?: {
        content?: string;
        permissions?: string;
        agentId?: string;
        userId?: string;
    }): Promise<TheiaFileOperation>;
    /**
     * Read file content
     */
    readFile(projectId: string, filePath: string, options?: {
        encoding?: string;
        range?: {
            start: number;
            end: number;
        };
    }): Promise<TheiaFileContent>;
    /**
     * Write file content
     */
    writeFile(projectId: string, filePath: string, content: string, options?: {
        encoding?: string;
        createIfNotExists?: boolean;
        agentId?: string;
    }): Promise<TheiaFileOperation>;
    /**
     * Watch file for changes
     */
    watchFile(projectId: string, filePath: string, agentId: string, callback: (event: TheiaFileEvent) => void): Promise<string>;
    /**
     * Stop watching file
     */
    unwatchFile(watchId: string): Promise<boolean>;
    /**
     * Execute terminal command
     */
    executeCommand(projectId: string, command: string, options?: {
        cwd?: string;
        env?: Record<string, string>;
        timeout?: number;
        agentId?: string;
    }): Promise<TheiaCommandResult>;
    /**
     * Get project structure
     */
    getProjectStructure(projectId: string, options?: {
        includeHidden?: boolean;
        maxDepth?: number;
        excludePatterns?: string[];
    }): Promise<TheiaProjectStructure>;
    /**
     * Search in project files
     */
    searchInProject(projectId: string, query: string, options?: TheiaSearchOptions): Promise<TheiaSearchResult[]>;
    /**
     * Get workspace metrics
     */
    getWorkspaceMetrics(workspaceId: string): Promise<TheiaWorkspaceMetrics>;
}
export interface TheiaFileContent {
    filePath: string;
    content: string;
    encoding: string;
    size: number;
    lastModified: Date;
    checksum: string;
    mimeType?: string;
}
export interface TheiaFileEvent {
    type: 'created' | 'modified' | 'deleted' | 'renamed';
    filePath: string;
    timestamp: Date;
    details?: {
        oldPath?: string;
        newContent?: string;
        size?: number;
    };
}
export interface TheiaCommandResult {
    command: string;
    exitCode: number;
    stdout: string;
    stderr: string;
    duration: number;
    startTime: Date;
    endTime: Date;
    cwd: string;
    error?: string;
}
export interface TheiaProjectStructure {
    projectId: string;
    rootPath: string;
    files: TheiaFileNode[];
    totalFiles: number;
    totalSize: bigint;
    lastUpdated: Date;
}
export interface TheiaFileNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    size?: bigint;
    lastModified?: Date;
    children?: TheiaFileNode[];
    mimeType?: string;
    isSymlink?: boolean;
    permissions?: string;
}
export interface TheiaSearchOptions {
    caseSensitive?: boolean;
    useRegex?: boolean;
    includeFileContent?: boolean;
    filePatterns?: string[];
    excludePatterns?: string[];
    maxResults?: number;
}
export interface TheiaSearchResult {
    filePath: string;
    fileName: string;
    matches: Array<{
        line: number;
        column: number;
        text: string;
        context?: {
            before: string[];
            after: string[];
        };
    }>;
    totalMatches: number;
}
export interface TheiaWorkspaceMetrics {
    workspaceId: string;
    totalProjects: number;
    activeProjects: number;
    totalFiles: number;
    totalSize: bigint;
    activeSessions: number;
    totalSessions: number;
    averageSessionDuration: number;
    totalFileOperations: number;
    fileOperationsByType: Record<TheiaOperation, number>;
    totalCommands: number;
    averageCommandDuration: number;
    aiEnabledProjects: number;
    automationLevel: Record<TheiaAutomationLevel, number>;
    recentOperations: TheiaFileOperation[];
    recentCommands: TheiaCommandResult[];
}
export interface TheiaLanguageServer {
    /**
     * Initialize language server for project
     */
    initializeLanguageServer(projectId: string, language: string, config?: Record<string, any>): Promise<TheiaLanguageServerInstance>;
    /**
     * Get code completions
     */
    getCompletions(projectId: string, filePath: string, position: TheiaPosition, context?: TheiaCompletionContext): Promise<TheiaCompletion[]>;
    /**
     * Get code diagnostics
     */
    getDiagnostics(projectId: string, filePath: string): Promise<TheiaDiagnostic[]>;
    /**
     * Format code
     */
    formatCode(projectId: string, filePath: string, options?: TheiaFormatOptions): Promise<TheiaTextEdit[]>;
    /**
     * Rename symbol
     */
    renameSymbol(projectId: string, filePath: string, position: TheiaPosition, newName: string): Promise<TheiaWorkspaceEdit>;
    /**
     * Find references
     */
    findReferences(projectId: string, filePath: string, position: TheiaPosition, includeDeclaration?: boolean): Promise<TheiaLocation[]>;
    /**
     * Go to definition
     */
    gotoDefinition(projectId: string, filePath: string, position: TheiaPosition): Promise<TheiaLocation[]>;
}
export interface TheiaLanguageServerInstance extends BaseEntity {
    projectId: string;
    language: string;
    serverPath: string;
    status: 'starting' | 'running' | 'stopped' | 'error';
    capabilities: Record<string, boolean>;
    version?: string;
    lastActivity: Date;
}
export interface TheiaPosition {
    line: number;
    character: number;
}
export interface TheiaRange {
    start: TheiaPosition;
    end: TheiaPosition;
}
export interface TheiaCompletionContext {
    triggerKind: 'invoked' | 'trigger-character' | 'trigger-for-incomplete';
    triggerCharacter?: string;
}
export interface TheiaCompletion {
    label: string;
    kind: TheiaCompletionKind;
    detail?: string;
    documentation?: string;
    insertText?: string;
    textEdit?: TheiaTextEdit;
    sortText?: string;
    filterText?: string;
    additionalTextEdits?: TheiaTextEdit[];
}
export declare enum TheiaCompletionKind {
    TEXT = 1,
    METHOD = 2,
    FUNCTION = 3,
    CONSTRUCTOR = 4,
    FIELD = 5,
    VARIABLE = 6,
    CLASS = 7,
    INTERFACE = 8,
    MODULE = 9,
    PROPERTY = 10,
    UNIT = 11,
    VALUE = 12,
    ENUM = 13,
    KEYWORD = 14,
    SNIPPET = 15,
    COLOR = 16,
    FILE = 17,
    REFERENCE = 18
}
export interface TheiaDiagnostic {
    range: TheiaRange;
    severity: 'error' | 'warning' | 'info' | 'hint';
    code?: string;
    source?: string;
    message: string;
    relatedInformation?: Array<{
        location: TheiaLocation;
        message: string;
    }>;
}
export interface TheiaTextEdit {
    range: TheiaRange;
    newText: string;
}
export interface TheiaWorkspaceEdit {
    changes: Record<string, TheiaTextEdit[]>;
}
export interface TheiaLocation {
    uri: string;
    range: TheiaRange;
}
export interface TheiaFormatOptions {
    tabSize?: number;
    insertSpaces?: boolean;
    trimTrailingWhitespace?: boolean;
    insertFinalNewline?: boolean;
    trimFinalNewlines?: boolean;
}
export interface TheiaDebugger {
    /**
     * Start debug session
     */
    startDebugSession(projectId: string, config: TheiaDebugConfiguration): Promise<TheiaDebugSession>;
    /**
     * Stop debug session
     */
    stopDebugSession(sessionId: string): Promise<boolean>;
    /**
     * Set breakpoint
     */
    setBreakpoint(sessionId: string, filePath: string, line: number, condition?: string): Promise<TheiaBreakpoint>;
    /**
     * Remove breakpoint
     */
    removeBreakpoint(sessionId: string, breakpointId: string): Promise<boolean>;
    /**
     * Continue execution
     */
    continue(sessionId: string): Promise<boolean>;
    /**
     * Step over
     */
    stepOver(sessionId: string): Promise<boolean>;
    /**
     * Step into
     */
    stepInto(sessionId: string): Promise<boolean>;
    /**
     * Step out
     */
    stepOut(sessionId: string): Promise<boolean>;
    /**
     * Evaluate expression
     */
    evaluateExpression(sessionId: string, expression: string, frameId?: number): Promise<TheiaEvaluateResult>;
    /**
     * Get stack trace
     */
    getStackTrace(sessionId: string): Promise<TheiaStackFrame[]>;
    /**
     * Get variables
     */
    getVariables(sessionId: string, scopeId: number): Promise<TheiaVariable[]>;
}
export interface TheiaDebugConfiguration {
    type: string;
    name: string;
    program: string;
    args?: string[];
    env?: Record<string, string>;
    cwd?: string;
    stopOnEntry?: boolean;
}
export interface TheiaDebugSession {
    id: string;
    projectId: string;
    configuration: TheiaDebugConfiguration;
    status: 'starting' | 'running' | 'stopped' | 'paused' | 'error';
    startTime: Date;
    currentFile?: string;
    currentLine?: number;
}
export interface TheiaBreakpoint {
    id: string;
    sessionId: string;
    filePath: string;
    line: number;
    condition?: string;
    isActive: boolean;
    verified: boolean;
}
export interface TheiaEvaluateResult {
    result: string;
    type?: string;
    variablesReference?: number;
    namedVariables?: number;
    indexedVariables?: number;
}
export interface TheiaStackFrame {
    id: number;
    name: string;
    source?: {
        name: string;
        path: string;
    };
    line: number;
    column: number;
    endLine?: number;
    endColumn?: number;
}
export interface TheiaVariable {
    name: string;
    value: string;
    type?: string;
    variablesReference?: number;
    namedVariables?: number;
    indexedVariables?: number;
}
//# sourceMappingURL=theia-types.d.ts.map