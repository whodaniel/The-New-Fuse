"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeCommandAPI = exports.executeCommandNode = exports.useCommandPalette = void 0;
const react_1 = require("react");
/**
 * Hook for managing command palette state and execution
 */
const useCommandPalette = (options = {}) => {
    const { shortcut = 'Cmd+K', onExecute: customOnExecute, onOpen, onClose: customOnClose, } = options;
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    const [isExecuting, setIsExecuting] = (0, react_1.useState)(false);
    const [executionResult, setExecutionResult] = (0, react_1.useState)(null);
    const [executionHistory, setExecutionHistory] = (0, react_1.useState)([]);
    /**
     * Open command palette
     */
    const open = (0, react_1.useCallback)(() => {
        setIsOpen(true);
        onOpen?.();
    }, [onOpen]);
    /**
     * Close command palette
     */
    const close = (0, react_1.useCallback)(() => {
        setIsOpen(false);
        setExecutionResult(null);
        customOnClose?.();
    }, [customOnClose]);
    /**
     * Toggle command palette
     */
    const toggle = (0, react_1.useCallback)(() => {
        if (isOpen) {
            close();
        }
        else {
            open();
        }
    }, [isOpen, open, close]);
    /**
     * Execute a command
     */
    const executeCommand = (0, react_1.useCallback)(async (command) => {
        setIsExecuting(true);
        setExecutionResult(null);
        try {
            let result;
            if (customOnExecute) {
                // Use custom executor
                result = await Promise.resolve(customOnExecute(command));
            }
            else {
                // Default: show command that would be executed
                result = {
                    success: true,
                    output: `Would execute: ${command.command}`,
                };
            }
            setExecutionResult(result);
            setExecutionHistory((prev) => [
                ...prev,
                {
                    command,
                    result,
                    timestamp: new Date(),
                },
            ]);
            return result;
        }
        catch (error) {
            const errorResult = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
            setExecutionResult(errorResult);
            return errorResult;
        }
        finally {
            setIsExecuting(false);
        }
    }, [customOnExecute]);
    /**
     * Clear execution history
     */
    const clearHistory = (0, react_1.useCallback)(() => {
        setExecutionHistory([]);
    }, []);
    /**
     * Get last N executions
     */
    const getRecentExecutions = (0, react_1.useCallback)((count = 10) => {
        return executionHistory.slice(-count).reverse();
    }, [executionHistory]);
    /**
     * Register keyboard shortcut
     */
    (0, react_1.useEffect)(() => {
        const handleKeyDown = (event) => {
            // Parse shortcut (e.g., "Cmd+K" or "Ctrl+K")
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const modifierKey = shortcut.toLowerCase().includes('cmd') ? 'metaKey' : 'ctrlKey';
            const key = shortcut.split('+').pop()?.toLowerCase();
            if (!key)
                return;
            const correctModifier = isMac
                ? event.metaKey && shortcut.toLowerCase().includes('cmd')
                : event.ctrlKey && shortcut.toLowerCase().includes('ctrl');
            if (correctModifier && event.key.toLowerCase() === key) {
                event.preventDefault();
                toggle();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcut, toggle]);
    return {
        // State
        isOpen,
        isExecuting,
        executionResult,
        executionHistory,
        // Actions
        open,
        close,
        toggle,
        executeCommand,
        clearHistory,
        getRecentExecutions,
    };
};
exports.useCommandPalette = useCommandPalette;
/**
 * Execute command via Node.js child_process (for Electron/Node environments)
 */
const executeCommandNode = async (command) => {
    // This would be implemented in an Electron or Node.js environment
    // For now, return a placeholder
    if (typeof window !== 'undefined' && window.electron) {
        // Electron IPC
        try {
            const result = await window.electron.executeCommand(command.command);
            return result;
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Execution failed',
            };
        }
    }
    // Browser environment - can't execute shell commands directly
    return {
        success: false,
        error: 'Command execution not available in browser environment. Use Electron or Node.js.',
    };
};
exports.executeCommandNode = executeCommandNode;
/**
 * Execute command via API endpoint
 */
const executeCommandAPI = async (command, apiEndpoint = '/api/commands/execute') => {
    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                command: command.command,
                commandId: command.id,
            }),
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const result = await response.json();
        return result;
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'API request failed',
        };
    }
};
exports.executeCommandAPI = executeCommandAPI;
exports.default = exports.useCommandPalette;
//# sourceMappingURL=useCommandPalette.js.map