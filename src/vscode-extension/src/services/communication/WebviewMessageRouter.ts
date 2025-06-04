import * as vscode from 'vscode';
import { ChatService } from '../features/ChatService';
import { LLMService } from '../features/LLMService';
import { ConfigurationService } from '../core/ConfigurationService';
import { NotificationService } from '../core/NotificationService';

// Define a generic handler function type
type MessageHandler = (payload: any, webview: vscode.Webview) => Promise<any>;

// Interface for messages received from the webview
interface WebviewMessage {
    command: string;
    payload?: any;
    requestId?: string;
}

// Interface for responses sent back to the webview
interface WebviewResponse {
    command: 'response';
    requestId: string;
    payload?: any;
    error?: any;
}

/**
 * Handles message routing between webview UI components and the extension's backend services.
 * This service decouples the UI from direct service calls, allowing for a more modular architecture.
 */
export class WebviewMessageRouter {
    private handlers: Map<string, MessageHandler> = new Map();

    /**
     * Creates an instance of WebviewMessageRouter.
     * @param chatService - Instance of ChatService.
     * @param llmService - Instance of LLMService.
     * @param configurationService - Instance of ConfigurationService.
     * @param notificationService - Instance of NotificationService.
     *
     * Note: Services are injected here, and their methods can be exposed
     * via the registerHandler method.
     */
    constructor(
        private chatService: ChatService,
        private llmService: LLMService,
        private configurationService: ConfigurationService,
        private notificationService: NotificationService
    ) {
        // Example registrations - these would typically be more specific
        // and might involve more complex logic or direct method calls.
        this.registerHandler('chat:sendMessage', async (payload) => {
            // Assuming ChatService has a method like `handleIncomingMessage`
            // This is a placeholder for actual implementation
            return this.chatService.handleWebviewMessage(payload);
        });

        this.registerHandler('llm:generateResponse', async (payload) => {
            // Assuming LLMService has a method like `processGenerationRequest`
            // This is a placeholder for actual implementation
            return this.llmService.handleWebviewMessage(payload);
        });

        this.registerHandler('config:getSetting', async (payload) => {
            // Example: Get a configuration setting
            if (payload && typeof payload.key === 'string') {
                return this.configurationService.get(payload.key);
            }
            throw new Error('Invalid payload for config:getSetting. "key" is required.');
        });

        this.registerHandler('notification:showInfo', async (payload) => {
            // Example: Show an information message
            if (payload && typeof payload.message === 'string') {
                this.notificationService.showInformation(payload.message);
                return { success: true };
            }
            throw new Error('Invalid payload for notification:showInfo. "message" is required.');
        });
    }

    /**
     * Registers a handler for a specific message type.
     * @param messageType - The command string (e.g., "chat:sendMessage").
     * @param handler - The function to execute when a message of this type is received.
     */
    public registerHandler(messageType: string, handler: MessageHandler): void {
        if (this.handlers.has(messageType)) {
            console.warn(`[WebviewMessageRouter] Handler for message type "${messageType}" is being overwritten.`);
        }
        this.handlers.set(messageType, handler);
    }

    /**
     * Registers a service, making its public methods available as handlers.
     * This is a conceptual method; a more robust implementation might use decorators
     * or a more explicit mapping of service methods to message types.
     * @param serviceName - A prefix for message types (e.g., "chat").
     * @param serviceInstance - The instance of the service.
     */
    public registerService(serviceName: string, serviceInstance: any): void {
        // This is a simplified example. A real implementation would need to
        // inspect the serviceInstance, identify public methods, and create
        // appropriate handlers. It might also need a way to map method names
        // to message command strings (e.g., serviceName:methodName).
        for (const methodName of Object.getOwnPropertyNames(Object.getPrototypeOf(serviceInstance))) {
            const method = serviceInstance[methodName];
            if (typeof method === 'function' && methodName !== 'constructor') {
                const messageType = `${serviceName}:${methodName}`;
                this.registerHandler(messageType, (payload, webview) => {
                    // Ensure 'this' context is correct when calling service method
                    return method.call(serviceInstance, payload, webview);
                });
                console.log(`[WebviewMessageRouter] Registered handler for ${messageType}`);
            }
        }
    }


    /**
     * Handles an incoming message from a webview.
     * It identifies the target handler based on `message.command`, invokes it,
     * and sends a response back to the webview if a `requestId` is present.
     * @param webview - The `vscode.Webview` instance from which the message originated.
     * @param message - The message object received from the webview.
     */
    public async handleMessage(webview: vscode.Webview, message: WebviewMessage): Promise<void> {
        const handler = this.handlers.get(message.command);

        if (handler) {
            try {
                const result = await handler(message.payload, webview);
                if (message.requestId) {
                    const response: WebviewResponse = {
                        command: 'response',
                        requestId: message.requestId,
                        payload: result,
                    };
                    webview.postMessage(response);
                }
            } catch (error: any) {
                console.error(`[WebviewMessageRouter] Error handling message "${message.command}":`, error);
                if (message.requestId) {
                    const response: WebviewResponse = {
                        command: 'response',
                        requestId: message.requestId,
                        error: {
                            message: error.message || 'An unknown error occurred',
                            stack: error.stack,
                            name: error.name,
                        },
                    };
                    webview.postMessage(response);
                }
                // Optionally, notify the user via NotificationService for critical errors
                // this.notificationService.showError(`Error processing command "${message.command}": ${error.message}`);
            }
        } else {
            console.warn(`[WebviewMessageRouter] No handler registered for command: ${message.command}`);
            if (message.requestId) {
                const response: WebviewResponse = {
                    command: 'response',
                    requestId: message.requestId,
                    error: { message: `No handler for command: ${message.command}` },
                };
                webview.postMessage(response);
            }
        }
    }
}