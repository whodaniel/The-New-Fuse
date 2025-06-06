import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { FileCoordinationManager } from './FileCoordinationManager';

/**
 * Example integration of the File Creation Participants system
 * with the main The New Fuse VS Code extension
 */
export class FileCoordinationIntegration {
  private fileCoordinationManager: FileCoordinationManager | null = null;
  
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly eventEmitter: EventEmitter,
    private readonly swarmOrchestrator: any, // Your existing swarm orchestrator
    private readonly interAgentChat: any // Your existing inter-agent chat service
  ) {}

  /**
   * Initialize the file coordination system
   */
  public async initialize(): Promise<void> {
    console.log('[FileCoordinationIntegration] Initializing file coordination system');

    try {
      // Create the file coordination manager
      this.fileCoordinationManager = new FileCoordinationManager(
        this.eventEmitter,
        this.swarmOrchestrator,
        this.interAgentChat
      );

      // Initialize the system
      await this.fileCoordinationManager.initialize(this.context);

      // Setup event listeners for demonstration
      this.setupEventListeners();

      // Register commands
      this.registerCommands();

      console.log('[FileCoordinationIntegration] File coordination system initialized successfully');

    } catch (error) {
      console.error('[FileCoordinationIntegration] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Setup event listeners to demonstrate the system
   */
  private setupEventListeners(): void {
    // Listen for file coordination events
    this.eventEmitter.on('file-creation.coordination-needed', (event) => {
      console.log('[FileCoordinationIntegration] Coordination needed for:', event.event.fileName);
      
      // Show notification to user
      vscode.window.showInformationMessage(
        `Multi-agent coordination starting for: ${event.event.fileName}`,
        'Show Details'
      ).then(selection => {
        if (selection === 'Show Details') {
          this.showCoordinationDetails(event);
        }
      });
    });

    this.eventEmitter.on('file-creation.coordinated', (event) => {
      console.log('[FileCoordinationIntegration] File coordination completed:', event.fileName);
      
      vscode.window.showInformationMessage(
        `File created with ${event.participatingAgents.length} agents: ${event.fileName}`
      );
    });

    // Listen for agent coordination events
    this.eventEmitter.on('agent-coordination.file-creation-completed', (event) => {
      console.log('[FileCoordinationIntegration] Agent coordination completed for:', event.fileName);
    });
  }

  /**
   * Register VS Code commands
   */
  private registerCommands(): void {
    // Command to demonstrate file creation coordination
    const demoCommand = vscode.commands.registerCommand(
      'thefuse.demo.fileCoordination',
      () => this.demonstrateFileCoordination()
    );

    // Command to create a test file that will trigger coordination
    const createTestFileCommand = vscode.commands.registerCommand(
      'thefuse.demo.createTestFile',
      () => this.createTestFile()
    );

    this.context.subscriptions.push(demoCommand, createTestFileCommand);
  }

  /**
   * Demonstrate file coordination by creating a complex file
   */
  private async demonstrateFileCoordination(): Promise<void> {
    try {
      // Get workspace folder
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }

      // Prompt user for file name
      const fileName = await vscode.window.showInputBox({
        prompt: 'Enter file name to create (e.g., MyComponent.tsx)',
        placeHolder: 'MyComponent.tsx'
      });

      if (!fileName) {return;}

      // Create file URI
      const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, fileName);

      // Show information about what will happen
      const message = `Creating ${fileName} will trigger multi-agent coordination involving:
• Code Analysis Agent - Analyzes context and dependencies
• Template Agent - Prepares appropriate boilerplate
• File Watcher Agent - Sets up monitoring
• Agent Coordination Manager - Manages complex coordination

Proceed with file creation?`;

      const proceed = await vscode.window.showInformationMessage(
        'Multi-Agent File Creation',
        { modal: true, detail: message },
        'Create File',
        'Cancel'
      );

      if (proceed === 'Create File') {
        // Create the file - this will trigger the coordination system
        await vscode.workspace.fs.writeFile(fileUri, new TextEncoder().encode(''));
        
        // Open the file to show the result
        const document = await vscode.workspace.openTextDocument(fileUri);
        await vscode.window.showTextDocument(document);
      }

    } catch (error) {
      vscode.window.showErrorMessage(`Error demonstrating file coordination: ${error}`);
    }
  }

  /**
   * Create a test file that will trigger coordination
   */
  private async createTestFile(): Promise<void> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }

      // Create a file that will trigger coordination
      const fileName = `TestComponent-${Date.now()}.tsx`;
      const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, fileName);

      vscode.window.showInformationMessage(
        `Creating test file: ${fileName}. Watch for coordination notifications!`
      );

      // Create the file
      await vscode.workspace.fs.writeFile(fileUri, new TextEncoder().encode(''));
      
      // Open the file
      const document = await vscode.workspace.openTextDocument(fileUri);
      await vscode.window.showTextDocument(document);

    } catch (error) {
      vscode.window.showErrorMessage(`Error creating test file: ${error}`);
    }
  }

  /**
   * Show coordination details
   */
  private async showCoordinationDetails(event: any): Promise<void> {
    const details = `
**File Coordination Details**

**File:** ${event.event.fileName}
**Extension:** ${event.event.extension}
**Directory:** ${event.event.directory}

**Coordination Requests:** ${event.coordinationRequests.length}
${event.coordinationRequests.map((req: any) => 
  `• ${req.agentName}: ${req.coordinationNeeded.reason}`
).join('\n')}

**Involved Agents:**
${event.coordinationRequests.map((req: any) => 
  `• ${req.agentName} (${req.agentId})`
).join('\n')}
    `.trim();

    await vscode.window.showInformationMessage(
      'Coordination Details',
      { modal: true, detail: details }
    );
  }

  /**
   * Get the coordination manager
   */
  public getCoordinationManager(): FileCoordinationManager | null {
    return this.fileCoordinationManager;
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    if (this.fileCoordinationManager) {
      this.fileCoordinationManager.dispose();
    }
  }
}

/**
 * Example of how to integrate this into your main extension.ts activate function
 */
export async function integrateWithMainExtension(
  context: vscode.ExtensionContext,
  eventEmitter: EventEmitter,
  swarmOrchestrator: any,
  interAgentChat: any
): Promise<FileCoordinationIntegration> {
  
  const integration = new FileCoordinationIntegration(
    context,
    eventEmitter,
    swarmOrchestrator,
    interAgentChat
  );

  await integration.initialize();
  
  // Register disposal
  context.subscriptions.push({
    dispose: () => integration.dispose()
  });

  return integration;
}

/**
 * Example package.json contribution for the commands
 */
export const PACKAGE_JSON_CONTRIBUTIONS = {
  "contributes": {
    "commands": [
      {
        "command": "thefuse.demo.fileCoordination",
        "title": "Demo: Multi-Agent File Coordination",
        "category": "The New Fuse"
      },
      {
        "command": "thefuse.demo.createTestFile",
        "title": "Demo: Create Test File with Coordination",
        "category": "The New Fuse"
      },
      {
        "command": "thefuse.fileCoordination.showStatus",
        "title": "Show File Coordination Status",
        "category": "The New Fuse"
      },
      {
        "command": "thefuse.fileCoordination.toggle",
        "title": "Toggle File Coordination",
        "category": "The New Fuse"
      },
      {
        "command": "thefuse.fileCoordination.reloadConfig",
        "title": "Reload File Coordination Config",
        "category": "The New Fuse"
      }
    ],
    "configuration": {
      "title": "The New Fuse File Coordination",
      "properties": {
        "thefuse.fileCoordination.enableParticipants": {
          "type": "boolean",
          "default": true,
          "description": "Enable file creation participants for multi-agent coordination"
        },
        "thefuse.fileCoordination.enableSwarmIntegration": {
          "type": "boolean",
          "default": true,
          "description": "Enable integration with agent swarm orchestration"
        },
        "thefuse.fileCoordination.enableAgentChat": {
          "type": "boolean",
          "default": true,
          "description": "Enable agent chat coordination during file creation"
        },
        "thefuse.fileCoordination.coordinationTimeout": {
          "type": "number",
          "default": 10000,
          "description": "Timeout for coordination in milliseconds"
        },
        "thefuse.fileCoordination.maxParticipants": {
          "type": "number",
          "default": 10,
          "description": "Maximum number of participant agents"
        },
        "thefuse.fileCoordination.logLevel": {
          "type": "string",
          "enum": ["debug", "info", "warn", "error"],
          "default": "info",
          "description": "Log level for file coordination system"
        }
      }
    }
  }
};
