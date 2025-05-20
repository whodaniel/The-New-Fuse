/**
 * Refactoring Service 
 * 
 * Coordinates code refactoring operations with Roo Code to clean up and consolidate
 * the codebase, eliminating redundant and obsolete components.
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { RooCodeCommunication } from './RooCodeCommunication.js';

interface RefactoringTask {
  id: string;
  type: 'consolidation' | 'pruning' | 'enhancement' | 'migration';
  targetFiles: string[];
  destinationFile?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

interface RefactoringResult {
  taskId: string;
  success: boolean;
  consolidatedCode?: string;
  removedFiles?: string[];
  backupLocation?: string;
  suggestedChanges?: any;
  error?: string;
}

export class RefactoringService extends EventEmitter {
  private rooCodeCommunication: RooCodeCommunication;
  private tasks: Map<string, RefactoringTask>;
  private backupDir: string;
  private projectRoot: string;
  private debug: boolean;
  
  constructor(options: {
    rooCodeCommunication: RooCodeCommunication;
    projectRoot: string;
    backupDir?: string;
    debug?: boolean;
  }) {
    super();
    this.rooCodeCommunication = options.rooCodeCommunication;
    this.projectRoot = options.projectRoot;
    this.backupDir = options.backupDir || path.join(this.projectRoot, 'backup');
    this.debug = options.debug || false;
    this.tasks = new Map();
    
    // Set up listeners for Roo Code communication
    this.setupRooCodeListeners();
  }
  
  /**
   * Initialize the refactoring service
   */
  async initialize(): Promise<void> {
    this.log('Initializing RefactoringService...');
    
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      this.log(`Created backup directory at ${this.backupDir}`);
    }
    
    this.log('RefactoringService initialized successfully');
  }
  
  /**
   * Set up listeners for Roo Code communication events
   */
  private setupRooCodeListeners(): void {
    this.rooCodeCommunication.on('refactoring', (content) => {
      const taskId = content.taskId;
      if (taskId && this.tasks.has(taskId)) {
        this.processRefactoringSuggestion(taskId, content);
      }
    });
    
    this.rooCodeCommunication.on('analysis', (content) => {
      const taskId = content.taskId;
      if (taskId && this.tasks.has(taskId)) {
        this.processAnalysisResult(taskId, content);
      }
    });
    
    this.rooCodeCommunication.on('error', (content) => {
      const taskId = content.taskId;
      if (taskId && this.tasks.has(taskId)) {
        this.handleTaskError(taskId, content.error);
      }
    });
  }
  
  /**
   * Consolidate multiple files into a single refactored file
   */
  async consolidateFiles(
    sourceFilePaths: string[], 
    destinationFilePath: string, 
    refactoringGoals: string[] = []
  ): Promise<string> {
    this.log(`Starting consolidation of ${sourceFilePaths.length} files into ${destinationFilePath}`);
    
    const taskId = `consolidate_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Create task
    const task: RefactoringTask = {
      id: taskId,
      type: 'consolidation',
      targetFiles: sourceFilePaths,
      destinationFile: destinationFilePath,
      status: 'pending',
      startTime: new Date()
    };
    
    this.tasks.set(taskId, task);
    
    // Read source files
    const sourceFiles = await Promise.all(
      sourceFilePaths.map(async (filePath) => {
        const fullPath = path.resolve(this.projectRoot, filePath);
        try {
          const content = await fs.promises.readFile(fullPath, 'utf-8');
          return { path: filePath, content };
        } catch (error) {
          this.log(`Error reading file ${fullPath}: ${error}`);
          throw new Error(`Failed to read file ${filePath}`);
        }
      })
    );
    
    // Update task status
    task.status = 'in_progress';
    this.tasks.set(taskId, task);
    
    // Request refactoring from Roo Code
    try {
      await this.rooCodeCommunication.requestCollaboration(
        'file_consolidation',
        {
          taskId,
          sourceFiles,
          destinationFile: destinationFilePath,
          refactoringGoals
        },
        'high'
      );
      
      // Return task ID which can be used to track progress
      return taskId;
    } catch (error) {
      this.handleTaskError(taskId, (error as Error).message);
      throw error;
    }
  }
  
  /**
   * Clean up obsolete files by backing them up and removing from main codebase
   */
  async pruneFiles(filePaths: string[]): Promise<string[]> {
    this.log(`Starting pruning of ${filePaths.length} files`);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupSubDir = path.join(this.backupDir, `pruned_${timestamp}`);
    
    // Create backup subdirectory
    if (!fs.existsSync(backupSubDir)) {
      fs.mkdirSync(backupSubDir, { recursive: true });
    }
    
    const backedUpFiles: string[] = [];
    
    // Back up and remove each file
    for (const filePath of filePaths) {
      const fullPath = path.resolve(this.projectRoot, filePath);
      
      try {
        // Check if file exists
        if (!fs.existsSync(fullPath)) {
          this.log(`File not found: ${fullPath}`);
          continue;
        }
        
        // Create directory structure in backup location
        const relativeDir = path.dirname(filePath);
        const backupDir = path.join(backupSubDir, relativeDir);
        
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        
        // Copy file to backup location
        const backupPath = path.join(backupSubDir, filePath);
        fs.copyFileSync(fullPath, backupPath);
        
        // Remove original file
        fs.unlinkSync(fullPath);
        
        backedUpFiles.push(filePath);
        this.log(`Backed up and removed: ${filePath}`);
      } catch (error) {
        this.log(`Error pruning file ${fullPath}: ${error}`);
      }
    }
    
    // Clean up empty directories
    this.cleanEmptyDirectories(this.projectRoot);
    
    return backedUpFiles;
  }
  
  /**
   * Recursively remove empty directories
   */
  private cleanEmptyDirectories(dir: string): void {
    if (!fs.existsSync(dir)) return;
    
    let files = fs.readdirSync(dir);
    
    if (files.length === 0) {
      // Directory is empty, remove it if it's not the project root
      if (dir !== this.projectRoot) {
        fs.rmdirSync(dir);
        this.log(`Removed empty directory: ${dir}`);
      }
      return;
    }
    
    // Process subdirectories
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        this.cleanEmptyDirectories(fullPath);
      }
    }
    
    // Check again after processing subdirectories
    files = fs.readdirSync(dir);
    if (files.length === 0 && dir !== this.projectRoot) {
      fs.rmdirSync(dir);
      this.log(`Removed empty directory: ${dir}`);
    }
  }
  
  /**
   * Analyze files for potential consolidation candidates
   */
  async analyzeFilesForConsolidation(
    directoryPath: string, 
    fileTypes: string[] = ['.ts', '.tsx', '.js', '.jsx']
  ): Promise<any> {
    this.log(`Analyzing files in ${directoryPath} for consolidation opportunities`);
    
    const taskId = `analyze_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Create task
    const task: RefactoringTask = {
      id: taskId,
      type: 'enhancement',
      targetFiles: [directoryPath],
      status: 'pending',
      startTime: new Date()
    };
    
    this.tasks.set(taskId, task);
    
    // Get list of files to analyze
    const filesToAnalyze = this.getFilesInDirectory(
      path.resolve(this.projectRoot, directoryPath), 
      fileTypes
    );
    
    // Update task with specific files
    task.targetFiles = filesToAnalyze.map(file => 
      path.relative(this.projectRoot, file)
    );
    task.status = 'in_progress';
    this.tasks.set(taskId, task);
    
    // Read content of files
    const fileContents = await Promise.all(
      task.targetFiles.map(async (filePath) => {
        const fullPath = path.resolve(this.projectRoot, filePath);
        const content = await fs.promises.readFile(fullPath, 'utf-8');
        return { path: filePath, content };
      })
    );
    
    // Request analysis from Roo Code
    try {
      await this.rooCodeCommunication.requestCollaboration(
        'consolidation_analysis',
        {
          taskId,
          files: fileContents,
          fileTypes,
          analysisGoals: [
            'identify_similar_components',
            'detect_duplicate_functionality',
            'suggest_consolidation_targets'
          ]
        },
        'medium'
      );
      
      return taskId;
    } catch (error) {
      this.handleTaskError(taskId, (error as Error).message);
      throw error;
    }
  }
  
  /**
   * Get all files in a directory recursively
   */
  private getFilesInDirectory(
    dir: string, 
    fileExtensions: string[] = []
  ): string[] {
    let results: string[] = [];
    
    if (!fs.existsSync(dir)) {
      return results;
    }
    
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip backup directory and node_modules
        if (fullPath === this.backupDir || file === 'node_modules' || file === '.git') {
          continue;
        }
        
        // Recursively get files from subdirectories
        results = results.concat(this.getFilesInDirectory(fullPath, fileExtensions));
      } else {
        // Check file extension if filter is provided
        if (fileExtensions.length === 0 || 
            fileExtensions.some(ext => file.endsWith(ext))) {
          results.push(fullPath);
        }
      }
    }
    
    return results;
  }
  
  /**
   * Get task status by ID
   */
  getTaskStatus(taskId: string): RefactoringTask | null {
    return this.tasks.get(taskId) || null;
  }
  
  /**
   * Process refactoring suggestion from Roo Code
   */
  private async processRefactoringSuggestion(taskId: string, content: any): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;
    
    this.log(`Processing refactoring suggestion for task ${taskId}`);
    
    try {
      // If this is a consolidation task with output code
      if (task.type === 'consolidation' && content.consolidatedCode && task.destinationFile) {
        // Create directories if they don't exist
        const destinationDir = path.dirname(path.resolve(this.projectRoot, task.destinationFile));
        if (!fs.existsSync(destinationDir)) {
          fs.mkdirSync(destinationDir, { recursive: true });
        }
        
        // Write consolidated code to destination file
        await fs.promises.writeFile(
          path.resolve(this.projectRoot, task.destinationFile),
          content.consolidatedCode
        );
        
        // Mark task as completed
        task.status = 'completed';
        task.endTime = new Date();
        this.tasks.set(taskId, task);
        
        // Emit completion event
        const result: RefactoringResult = {
          taskId,
          success: true,
          consolidatedCode: content.consolidatedCode,
          suggestedChanges: content.additionalSuggestions
        };
        
        this.emit('taskCompleted', result);
        this.log(`Consolidation task ${taskId} completed successfully`);
      } else {
        // For other types of tasks, just emit the suggestion
        this.emit('suggestion', {
          taskId,
          suggestion: content
        });
      }
    } catch (error) {
      this.handleTaskError(taskId, (error as Error).message);
    }
  }
  
  /**
   * Process analysis result from Roo Code
   */
  private processAnalysisResult(taskId: string, content: any): void {
    const task = this.tasks.get(taskId);
    if (!task) return;
    
    this.log(`Processing analysis result for task ${taskId}`);
    
    // Mark task as completed
    task.status = 'completed';
    task.endTime = new Date();
    this.tasks.set(taskId, task);
    
    // Emit analysis result
    this.emit('analysisCompleted', {
      taskId,
      analysis: content
    });
  }
  
  /**
   * Handle task error
   */
  private handleTaskError(taskId: string, errorMessage: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;
    
    this.log(`Error in task ${taskId}: ${errorMessage}`);
    
    // Mark task as failed
    task.status = 'failed';
    task.endTime = new Date();
    task.error = errorMessage;
    this.tasks.set(taskId, task);
    
    // Emit error event
    this.emit('taskError', {
      taskId,
      error: errorMessage
    });
  }
  
  /**
   * Utility method for logging if debug is enabled
   */
  private log(message: string): void {
    if (this.debug) {
      console.log(`[RefactoringService] ${message}`);
    }
  }
}