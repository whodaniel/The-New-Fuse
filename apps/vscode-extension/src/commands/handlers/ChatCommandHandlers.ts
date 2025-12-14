import {
  ICommandHandler,
  ICommand,
  ICommandContext,
  ICommandResult,
  BaseCommand,
  ErrorType
} from '@the-new-fuse/commands-core';
import { IVSCodeCommandContext } from '../VSCodeCommandAdapter';
import { ChatViewProvider } from '../../ChatViewProvider';

/**
 * Send Message Command
 */
export class SendMessageCommand extends BaseCommand<{ message: string }, void> {
  constructor(message: string) {
    super('send-message', { message }, {
      name: 'Send Message',
      description: 'Send a message to the AI chat',
      category: 'chat'
    });
  }

  protected async executeInternal(context: IVSCodeCommandContext): Promise<void> {
    const chatProvider = context.extensionContext.globalState.get('chatProvider') as ChatViewProvider;
    if (!chatProvider) {
      throw new Error('Chat provider not available');
    }

    await chatProvider.handleUserMessage(this.data.message);
  }

  protected async validateData(_context: IVSCodeCommandContext): Promise<import('@the-new-fuse/commands-core').ValidationError[]> {
    const errors: import('@the-new-fuse/commands-core').ValidationError[] = [];
    
    if (!this.data.message || this.data.message.trim() === '') {
      errors.push(this.createValidationError('REQUIRED', 'Message is required', 'message'));
    }
    
    return errors;
  }
}

/**
 * Clear Chat Command
 */
export class ClearChatCommand extends BaseCommand<void, void> {
  constructor() {
    super('clear-chat', undefined, {
      name: 'Clear Chat',
      description: 'Clear the current chat conversation',
      category: 'chat'
    });
  }

  protected async executeInternal(context: IVSCodeCommandContext): Promise<void> {
    const chatProvider = context.extensionContext.globalState.get('chatProvider') as ChatViewProvider;
    if (!chatProvider) {
      throw new Error('Chat provider not available');
    }

    chatProvider.clearChat();
  }
}

/**
 * New Chat Command
 */
export class NewChatCommand extends BaseCommand<void, void> {
  constructor() {
    super('new-chat', undefined, {
      name: 'New Chat',
      description: 'Start a new chat conversation',
      category: 'chat'
    });
  }

  protected async executeInternal(context: IVSCodeCommandContext): Promise<void> {
    const chatProvider = context.extensionContext.globalState.get('chatProvider') as ChatViewProvider;
    if (!chatProvider) {
      throw new Error('Chat provider not available');
    }

    chatProvider.newChat();
  }
}

/**
 * Send Message Handler
 */
export class SendMessageHandler implements ICommandHandler<{ message: string }, void> {
  async handle(command: ICommand<{ message: string }>, context: ICommandContext): Promise<ICommandResult<void>> {
    try {
      const vscodeContext = context as IVSCodeCommandContext;
      const chatProvider = vscodeContext.extensionContext.globalState.get('chatProvider') as ChatViewProvider;
      
      if (!chatProvider) {
        throw new Error('Chat provider not available');
      }

      await chatProvider.handleUserMessage(command.data.message);

      return {
        success: true,
        metadata: {
          executionTime: 0,
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SEND_MESSAGE_FAILED',
          message: (error as Error).message,
          type: ErrorType.INTERNAL,
          stack: (error as Error).stack
        },
        metadata: {
          executionTime: 0,
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    }
  }

  canHandle(command: ICommand): boolean {
    return command.type === 'send-message';
  }

  getMetadata() {
    return {
      name: 'SendMessageHandler',
      version: '1.0.0',
      commandTypes: ['send-message'],
      description: 'Handles sending messages to the AI chat'
    };
  }
}

/**
 * Clear Chat Handler
 */
export class ClearChatHandler implements ICommandHandler<void, void> {
  async handle(command: ICommand<void>, context: ICommandContext): Promise<ICommandResult<void>> {
    try {
      const vscodeContext = context as IVSCodeCommandContext;
      const chatProvider = vscodeContext.extensionContext.globalState.get('chatProvider') as ChatViewProvider;
      
      if (!chatProvider) {
        throw new Error('Chat provider not available');
      }

      chatProvider.clearChat();

      return {
        success: true,
        metadata: {
          executionTime: 0,
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CLEAR_CHAT_FAILED',
          message: (error as Error).message,
          type: ErrorType.INTERNAL,
          stack: (error as Error).stack
        },
        metadata: {
          executionTime: 0,
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    }
  }

  canHandle(command: ICommand): boolean {
    return command.type === 'clear-chat';
  }

  getMetadata() {
    return {
      name: 'ClearChatHandler',
      version: '1.0.0',
      commandTypes: ['clear-chat'],
      description: 'Handles clearing the chat conversation'
    };
  }
}

/**
 * New Chat Handler
 */
export class NewChatHandler implements ICommandHandler<void, void> {
  async handle(command: ICommand<void>, context: ICommandContext): Promise<ICommandResult<void>> {
    try {
      const vscodeContext = context as IVSCodeCommandContext;
      const chatProvider = vscodeContext.extensionContext.globalState.get('chatProvider') as ChatViewProvider;
      
      if (!chatProvider) {
        throw new Error('Chat provider not available');
      }

      chatProvider.newChat();

      return {
        success: true,
        metadata: {
          executionTime: 0,
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NEW_CHAT_FAILED',
          message: (error as Error).message,
          type: ErrorType.INTERNAL,
          stack: (error as Error).stack
        },
        metadata: {
          executionTime: 0,
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    }
  }

  canHandle(command: ICommand): boolean {
    return command.type === 'new-chat';
  }

  getMetadata() {
    return {
      name: 'NewChatHandler',
      version: '1.0.0',
      commandTypes: ['new-chat'],
      description: 'Handles starting a new chat conversation'
    };
  }
}