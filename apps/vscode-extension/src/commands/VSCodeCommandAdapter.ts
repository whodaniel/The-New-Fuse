import * as vscode from 'vscode';
import {
  ICommandBus,
  ICommandContext,
  ICommandResult,
  BaseCommand,
  createCommandBusWithDefaults,
  ICommandHandler,
  ErrorType
} from '@the-new-fuse/commands-core';

/**
 * VSCode-specific command context that extends the base command context
 */
export interface IVSCodeCommandContext extends ICommandContext {
  /**
   * VSCode extension context
   */
  readonly extensionContext: vscode.ExtensionContext;
  
  /**
   * VSCode API references
   */
  readonly vscode: {
    readonly window: typeof vscode.window;
    readonly workspace: typeof vscode.workspace;
    readonly commands: typeof vscode.commands;
    readonly env: typeof vscode.env;
    readonly Uri: typeof vscode.Uri;
  };
  
  /**
   * Progress indicator for long-running commands
   */
  readonly progress?: vscode.Progress<{ message?: string; increment?: number }>;
  
  /**
   * CancellationToken for command cancellation
   */
  readonly token?: vscode.CancellationToken;
}

/**
 * VSCode-specific command result with additional UI feedback
 */
export interface IVSCodeCommandResult<TResult = unknown> extends ICommandResult<TResult> {
  /**
   * VSCode-specific result metadata
   */
  readonly vscodeMetadata: {
    /**
     * Whether to show a notification to the user
     */
    readonly showNotification?: boolean;
    
    /**
     * Notification message (if showNotification is true)
     */
    readonly notificationMessage?: string;
    
    /**
     * Notification type
     */
    readonly notificationType?: 'info' | 'warning' | 'error';
    
    /**
     * Whether to refresh the UI
     */
    readonly refreshUI?: boolean;
    
    /**
     * Custom actions to show in the notification
     */
    readonly actions?: vscode.MessageItem[];
  };
}

/**
 * VSCode Command Adapter that bridges unified commands with VSCode APIs
 */
export class VSCodeCommandAdapter {
  private commandBus: ICommandBus;
  private extensionContext: vscode.ExtensionContext;
  private registeredCommands = new Map<string, vscode.Disposable>();

  constructor(extensionContext: vscode.ExtensionContext) {
    this.extensionContext = extensionContext;
    this.commandBus = createCommandBusWithDefaults({
      enableValidation: true,
      enableLogging: true,
      enableMetrics: true,
      defaultTimeout: 30000
    });

    this.setupVSCodeInterceptors();
  }

  /**
   * Get the underlying command bus
   */
  public getCommandBus(): ICommandBus {
    return this.commandBus;
  }

  /**
   * Register a VSCode command that uses the unified command architecture
   */
  public registerVSCodeCommand<TResult>(
    commandId: string,
    commandType: string,
    handler?: ICommandHandler<unknown, TResult>,
    options?: {
      category?: string;
      title?: string;
      icon?: string;
      enableProgress?: boolean;
    }
  ): void {
    // Register the handler with the command bus if provided
    if (handler) {
      this.commandBus.register(commandType, handler);
    }

    // Create the VSCode command wrapper
    const vscodeCommand = async (...args: unknown[]) => {
      return this.executeVSCodeCommand(commandType, args, options);
    };

    // Register with VSCode
    const disposable = vscode.commands.registerCommand(commandId, vscodeCommand);
    this.registeredCommands.set(commandId, disposable);
    this.extensionContext.subscriptions.push(disposable);

    console.log(`✅ Registered VSCode command: ${commandId} -> ${commandType}`);
  }

  /**
   * Execute a command with VSCode context and UI feedback
   */
  public async executeVSCodeCommand<TResult>(
    commandType: string,
    args: unknown[] = [],
    options?: {
      enableProgress?: boolean;
      progressTitle?: string;
    }
  ): Promise<IVSCodeCommandResult<TResult>> {
    const context = this.createVSCodeContext();

    // Create the command with provided arguments
    const command = this.createCommand(commandType, args);

    if (options?.enableProgress) {
      return await this.executeWithProgress(command, context, options.progressTitle || 'Executing command...');
    } else {
      return await this.executeCommand(command, context);
    }
  }

  /**
   * Execute a command with progress indicator
   */
  private async executeWithProgress<TResult>(
    command: BaseCommand<unknown, TResult>,
    context: IVSCodeCommandContext,
    title: string
  ): Promise<IVSCodeCommandResult<TResult>> {
    return await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title,
        cancellable: true
      },
      async (progress, token) => {
        const progressContext = {
          ...context,
          progress,
          token
        };

        return await this.executeCommand(command, progressContext);
      }
    );
  }

  /**
   * Execute a command and handle VSCode-specific result processing
   */
  private async executeCommand<TResult>(
    command: BaseCommand<unknown, TResult>,
    context: IVSCodeCommandContext
  ): Promise<IVSCodeCommandResult<TResult>> {
    try {
      const result = await this.commandBus.executeWithContext(command, context);
      
      // Convert to VSCode-specific result
      const vscodeResult: IVSCodeCommandResult<TResult> = {
        ...result,
        vscodeMetadata: {
          showNotification: true,
          notificationMessage: result.success ? 'Command completed successfully' : 'Command failed',
          notificationType: result.success ? 'info' : 'error',
          refreshUI: result.success
        }
      };

      // Show notification if needed
      if (vscodeResult.vscodeMetadata.showNotification) {
        await this.showNotification(
          vscodeResult.vscodeMetadata.notificationMessage || '',
          vscodeResult.vscodeMetadata.notificationType || 'info',
          vscodeResult.vscodeMetadata.actions
        );
      }

      return vscodeResult;

    } catch (error) {
      const errorResult: IVSCodeCommandResult<TResult> = {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: (error as Error).message,
          type: ErrorType.INTERNAL,
          stack: (error as Error).stack
        },
        metadata: {
          executionTime: 0,
          completedAt: new Date(),
          eventCount: 0
        },
        events: [],
        vscodeMetadata: {
          showNotification: true,
          notificationMessage: `Command failed: ${(error as Error).message}`,
          notificationType: 'error'
        }
      };

      await this.showNotification(errorResult.vscodeMetadata.notificationMessage!, 'error');
      return errorResult;
    }
  }

  /**
   * Create a VSCode command context
   */
  private createVSCodeContext(): IVSCodeCommandContext {
    return {
      executionId: this.generateExecutionId(),
      timestamp: new Date(),
      data: {},
      auth: {
        isAuthenticated: true,
        roles: ['user'],
        permissions: ['read', 'write'],
        claims: {}
      },
      extensionContext: this.extensionContext,
      vscode: {
        window: vscode.window,
        workspace: vscode.workspace,
        commands: vscode.commands,
        env: vscode.env,
        Uri: vscode.Uri
      }
    };
  }

  /**
   * Create a command instance based on command type and arguments
   */
  private createCommand(commandType: string, args: unknown[]): BaseCommand<unknown, unknown> {
    // This is a simplified factory - in a real implementation,
    // you would have a proper command factory or registry
    return new VSCodeCommand(commandType, { args });
  }

  /**
   * Setup VSCode-specific interceptors
   */
  private setupVSCodeInterceptors(): void {
    // Add VSCode-specific interceptor for UI feedback
    this.commandBus.intercept({
      name: 'vscode-ui-interceptor',
      async beforeExecute(command, context) {
        // Show status bar message
        const vscodeContext = context as IVSCodeCommandContext;
        vscodeContext.vscode.window.setStatusBarMessage(`Executing: ${command.type}`);
      },
      async afterExecute(_command, context, _result) {
        // Clear status bar message
        const vscodeContext = context as IVSCodeCommandContext;
        vscodeContext.vscode.window.setStatusBarMessage('');
      },
      async onError(command, context, error) {
        // Clear status bar message on error
        const vscodeContext = context as IVSCodeCommandContext;
        vscodeContext.vscode.window.setStatusBarMessage('');
        
        // Show error notification
        vscodeContext.vscode.window.showErrorMessage(`Command failed: ${error.message}`);
      }
    });
  }

  /**
   * Show notification to user
   */
  private async showNotification(
    message: string,
    type: 'info' | 'warning' | 'error' = 'info',
    actions?: vscode.MessageItem[]
  ): Promise<vscode.MessageItem | undefined> {
    switch (type) {
      case 'info':
        return await vscode.window.showInformationMessage(message, ...(actions || []));
      case 'warning':
        return await vscode.window.showWarningMessage(message, ...(actions || []));
      case 'error':
        return await vscode.window.showErrorMessage(message, ...(actions || []));
      default:
        return await vscode.window.showInformationMessage(message, ...(actions || []));
    }
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `vscode-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Dispose all registered commands
   */
  public dispose(): void {
    for (const [, disposable] of this.registeredCommands) {
      disposable.dispose();
    }
    this.registeredCommands.clear();
  }
}

/**
 * Base VSCode command implementation
 */
export class VSCodeCommand<TData = unknown, TResult = unknown> extends BaseCommand<TData, TResult> {
  constructor(commandType: string, data: TData) {
    super(commandType, data, {
      category: 'vscode',
      tags: ['vscode', 'extension']
    });
  }

  protected async executeInternal(_context: IVSCodeCommandContext): Promise<TResult> {
    // Default implementation - should be overridden by specific commands
    throw new Error(`ExecuteInternal not implemented for command type: ${this.type}`);
  }
}