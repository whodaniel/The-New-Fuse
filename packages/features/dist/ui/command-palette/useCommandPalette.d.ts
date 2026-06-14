import { Command } from './CommandPalette.js';
export interface CommandExecutionResult {
    success: boolean;
    output?: string;
    error?: string;
    exitCode?: number;
}
export interface UseCommandPaletteOptions {
    /**
     * Keyboard shortcut to open palette (default: 'Cmd+K' / 'Ctrl+K')
     */
    shortcut?: string;
    /**
     * Execute command handler
     */
    onExecute?: (command: Command) => Promise<CommandExecutionResult> | CommandExecutionResult;
    /**
     * Called when palette is opened
     */
    onOpen?: () => void;
    /**
     * Called when palette is closed
     */
    onClose?: () => void;
}
/**
 * Hook for managing command palette state and execution
 */
export declare const useCommandPalette: (options?: UseCommandPaletteOptions) => {
    isOpen: boolean;
    isExecuting: boolean;
    executionResult: CommandExecutionResult | null;
    executionHistory: {
        command: Command;
        result: CommandExecutionResult;
        timestamp: Date;
    }[];
    open: () => void;
    close: () => void;
    toggle: () => void;
    executeCommand: (command: Command) => Promise<CommandExecutionResult>;
    clearHistory: () => void;
    getRecentExecutions: (count?: number) => {
        command: Command;
        result: CommandExecutionResult;
        timestamp: Date;
    }[];
};
/**
 * Execute command via Node.js child_process (for Electron/Node environments)
 */
export declare const executeCommandNode: (command: Command) => Promise<CommandExecutionResult>;
/**
 * Execute command via API endpoint
 */
export declare const executeCommandAPI: (command: Command, apiEndpoint?: string) => Promise<CommandExecutionResult>;
export default useCommandPalette;
//# sourceMappingURL=useCommandPalette.d.ts.map