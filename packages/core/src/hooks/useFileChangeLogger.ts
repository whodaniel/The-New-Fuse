import { useEffect, useCallback } from 'react';
import { FileChangeTracker, FileChange } from '../utils/LoggingUtils.js';

/**
 * Options for the useFileChangeLogger hook
 */
interface UseFileChangeLoggerOptions {
  /**
   * Whether to automatically track file changes
   * @default true
   */
  autoTrack?: boolean;
  
  /**
   * The agent making the changes
   * @default 'Unknown Agent'
   */
  agent?: string;
  
  /**
   * Callback to run when changes are committed
   */
  onCommit?: (success: boolean) => void;
}

/**
 * Hook for logging file changes
 * 
 * This hook provides a way to track and log file changes in React components.
 * It can be used to semi-automate the process of updating the development log.
 * 
 * @param options - Options for the hook
 * @returns An object with functions for tracking and committing changes
 * 
 * @example
 * ```tsx
 * const { trackChange, commitChanges } = useFileChangeLogger({
 *   agent: 'MyAgent',
 *   onCommit: (success) => {
 *     if (success) {
 *       console.log('Changes committed successfully');
 *     }
 *   }
 * });
 * 
 * // Track a file change
 * trackChange('path/to/file.ts', 'modify', 'Updated component to handle new props');
 * 
 * // Commit changes to the development log
 * const handleSave = async () => {
 *   await commitChanges('Updated component', 'Added new features to the component');
 * };
 * ```
 */
export function useFileChangeLogger(options: UseFileChangeLoggerOptions = {}) {
  const {
    autoTrack = true,
    agent = 'Unknown Agent',
    onCommit
  } = options;

  /**
   * Track a file change
   * 
   * @param filePath - The path of the file that changed
   * @param changeType - The type of change
   * @param description - A description of the change
   */
  const trackChange = useCallback((
    filePath: string,
    changeType: 'create' | 'modify' | 'delete' | 'move',
    description: string
  ) => {
    FileChangeTracker.trackChange(filePath, changeType, description);
  }, []);

  /**
   * Commit tracked changes to the development log
   * 
   * @param title - The title of the log entry
   * @param description - The description of the changes
   * @returns A promise that resolves to true if the changes were committed successfully, false otherwise
   */
  const commitChanges = useCallback(async (
    title: string,
    description: string
  ): Promise<boolean> => {
    const result = await FileChangeTracker.commitChanges(agent, title, description);
    
    if (onCommit) {
      onCommit(result);
    }
    
    return result;
  }, [agent, onCommit]);

  /**
   * Get all tracked changes
   * 
   * @returns An array of all tracked file changes
   */
  const getTrackedChanges = useCallback((): FileChange[] => {
    return FileChangeTracker.getChanges();
  }, []);

  /**
   * Clear all tracked changes
   */
  const clearTrackedChanges = useCallback((): void => {
    FileChangeTracker.clearChanges();
  }, []);

  // Clean up tracked changes when the component unmounts
  useEffect(() => {
    return () => {
      if (!autoTrack) {
        FileChangeTracker.clearChanges();
      }
    };
  }, [autoTrack]);

  return {
    trackChange,
    commitChanges,
    getTrackedChanges,
    clearTrackedChanges
  };
}
