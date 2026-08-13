import { useCallback, useEffect, useState } from 'react';
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
export const useCommandPalette = (options: UseCommandPaletteOptions = {}) => {
  const {
    shortcut = 'Cmd+K',
    onExecute: customOnExecute,
    onOpen,
    onClose: customOnClose,
  } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<CommandExecutionResult | null>(null);
  const [executionHistory, setExecutionHistory] = useState<
    Array<{
      command: Command;
      result: CommandExecutionResult;
      timestamp: Date;
    }>
  >([]);

  /**
   * Open command palette
   */
  const open = useCallback(() => {
    setIsOpen(true);
    onOpen?.();
  }, [onOpen]);

  /**
   * Close command palette
   */
  const close = useCallback(() => {
    setIsOpen(false);
    setExecutionResult(null);
    customOnClose?.();
  }, [customOnClose]);

  /**
   * Toggle command palette
   */
  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  /**
   * Execute a command
   */
  const executeCommand = useCallback(
    async (command: Command) => {
      setIsExecuting(true);
      setExecutionResult(null);

      try {
        let result: CommandExecutionResult;

        if (customOnExecute) {
          // Use custom executor
          result = await Promise.resolve(customOnExecute(command));
        } else {
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
      } catch (error) {
        const errorResult: CommandExecutionResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };

        setExecutionResult(errorResult);
        return errorResult;
      } finally {
        setIsExecuting(false);
      }
    },
    [customOnExecute]
  );

  /**
   * Clear execution history
   */
  const clearHistory = useCallback(() => {
    setExecutionHistory([]);
  }, []);

  /**
   * Get last N executions
   */
  const getRecentExecutions = useCallback(
    (count: number = 10) => {
      return executionHistory.slice(-count).reverse();
    },
    [executionHistory]
  );

  /**
   * Register keyboard shortcut
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Parse shortcut (e.g., "Cmd+K" or "Ctrl+K")
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifierKey = shortcut.toLowerCase().includes('cmd') ? 'metaKey' : 'ctrlKey';
      const key = shortcut.split('+').pop()?.toLowerCase();

      if (!key) return;

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

/**
 * Execute command via Node.js child_process (for Electron/Node environments)
 */
export const executeCommandNode = async (command: Command): Promise<CommandExecutionResult> => {
  // This would be implemented in an Electron or Node.js environment
  // For now, return a placeholder

  if (typeof window !== 'undefined' && (window as any).electron) {
    // Electron IPC
    try {
      const result = await (window as any).electron.executeCommand(command.command);
      return result;
    } catch (error) {
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

/**
 * Execute command via API endpoint
 */
export const executeCommandAPI = async (
  command: Command,
  apiEndpoint: string = '/api/commands/execute'
): Promise<CommandExecutionResult> => {
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
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'API request failed',
    };
  }
};

export default useCommandPalette;
