import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './logger.js';

/**
 * Interface for file change information
 */
export interface FileChange {
  filePath: string;
  changeType: 'create' | 'modify' | 'delete' | 'move';
  description: string;
}

/**
 * Interface for development log entry
 */
export interface DevelopmentLogEntry {
  date: Date;
  title: string;
  agent: string;
  filesChanged: FileChange[];
  description: string;
  decisions?: { decision: string; rationale: string }[];
  challenges?: { challenge: string; solution: string }[];
  nextSteps?: string[];
}

/**
 * Utility class for logging development activities
 */
export class DevelopmentLogger {
  private static readonly LOG_FILE_PATH = 'docs/DEVELOPMENT_LOG.md';
  private static readonly logger = new Logger('DevelopmentLogger');

  /**
   * Add an entry to the development log
   * 
   * @param entry - The log entry to add
   * @returns True if the entry was added successfully, false otherwise
   */
  public static async addLogEntry(entry: DevelopmentLogEntry): Promise<boolean> {
    try {
      // Format the entry
      const formattedEntry = this.formatLogEntry(entry);
      
      // Read the current log file
      const logFilePath = path.resolve(process.cwd(), this.LOG_FILE_PATH);
      let logContent = '';
      
      try {
        logContent = await fs.promises.readFile(logFilePath, 'utf-8');
      } catch (error) {
        this.logger.error(`Failed to read log file: ${error.message}`);
        return false;
      }
      
      // Find the insertion point (after the existing entries section header)
      const insertionPoint = logContent.indexOf('## Log Entries') + '## Log Entries'.length;
      
      if (insertionPoint === -1) {
        this.logger.error('Failed to find insertion point in log file');
        return false;
      }
      
      // Insert the new entry
      const newLogContent = 
        logContent.slice(0, insertionPoint) + 
        '\n\n' + formattedEntry + 
        logContent.slice(insertionPoint);
      
      // Write the updated log file
      await fs.promises.writeFile(logFilePath, newLogContent, 'utf-8');
      
      this.logger.info(`Added log entry: ${entry.title}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to add log entry: ${error.message}`);
      return false;
    }
  }

  /**
   * Format a log entry as markdown
   * 
   * @param entry - The log entry to format
   * @returns The formatted log entry
   */
  private static formatLogEntry(entry: DevelopmentLogEntry): string {
    const dateStr = entry.date.toISOString().split('T')[0];
    
    let markdown = `### ${dateStr}: ${entry.title}\n\n`;
    markdown += `**Agent/Developer**: ${entry.agent}\n\n`;
    
    markdown += `**Files Changed**:\n`;
    for (const file of entry.filesChanged) {
      markdown += `- \`${file.filePath}\`: ${file.description}\n`;
    }
    
    markdown += `\n**Description**:\n${entry.description}\n\n`;
    
    if (entry.decisions && entry.decisions.length > 0) {
      markdown += `**Decisions**:\n`;
      for (const decision of entry.decisions) {
        markdown += `- ${decision.decision}: ${decision.rationale}\n`;
      }
      markdown += '\n';
    }
    
    if (entry.challenges && entry.challenges.length > 0) {
      markdown += `**Challenges**:\n`;
      for (const challenge of entry.challenges) {
        markdown += `- ${challenge.challenge}: ${challenge.solution}\n`;
      }
      markdown += '\n';
    }
    
    if (entry.nextSteps && entry.nextSteps.length > 0) {
      markdown += `**Next Steps**:\n`;
      for (const step of entry.nextSteps) {
        markdown += `- ${step}\n`;
      }
    }
    
    return markdown;
  }

  /**
   * Log file changes
   * 
   * @param changes - The file changes to log
   * @param agent - The agent making the changes
   * @param title - The title of the log entry
   * @param description - The description of the changes
   * @returns True if the changes were logged successfully, false otherwise
   */
  public static async logFileChanges(
    changes: FileChange[],
    agent: string,
    title: string,
    description: string
  ): Promise<boolean> {
    const entry: DevelopmentLogEntry = {
      date: new Date(),
      title,
      agent,
      filesChanged: changes,
      description
    };
    
    return this.addLogEntry(entry);
  }

  /**
   * Get the current development log content
   * 
   * @returns The current log content or null if the log file couldn't be read
   */
  public static async getLogContent(): Promise<string | null> {
    try {
      const logFilePath = path.resolve(process.cwd(), this.LOG_FILE_PATH);
      return await fs.promises.readFile(logFilePath, 'utf-8');
    } catch (error) {
      this.logger.error(`Failed to read log file: ${error.message}`);
      return null;
    }
  }
}

/**
 * Utility class for tracking file changes
 */
export class FileChangeTracker {
  private static fileChanges: Map<string, FileChange> = new Map();
  private static readonly logger = new Logger('FileChangeTracker');

  /**
   * Track a file change
   * 
   * @param filePath - The path of the file that changed
   * @param changeType - The type of change
   * @param description - A description of the change
   */
  public static trackChange(
    filePath: string,
    changeType: 'create' | 'modify' | 'delete' | 'move',
    description: string
  ): void {
    this.fileChanges.set(filePath, { filePath, changeType, description });
    this.logger.debug(`Tracked ${changeType} change to ${filePath}`);
  }

  /**
   * Get all tracked changes
   * 
   * @returns An array of all tracked file changes
   */
  public static getChanges(): FileChange[] {
    return Array.from(this.fileChanges.values());
  }

  /**
   * Clear all tracked changes
   */
  public static clearChanges(): void {
    this.fileChanges.clear();
    this.logger.debug('Cleared tracked changes');
  }

  /**
   * Commit tracked changes to the development log
   * 
   * @param agent - The agent making the changes
   * @param title - The title of the log entry
   * @param description - The description of the changes
   * @returns True if the changes were committed successfully, false otherwise
   */
  public static async commitChanges(
    agent: string,
    title: string,
    description: string
  ): Promise<boolean> {
    const changes = this.getChanges();
    
    if (changes.length === 0) {
      this.logger.warn('No changes to commit');
      return false;
    }
    
    const result = await DevelopmentLogger.logFileChanges(
      changes,
      agent,
      title,
      description
    );
    
    if (result) {
      this.clearChanges();
    }
    
    return result;
  }
}
