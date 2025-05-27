// /Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/src/vscode-extension/src/shared-protocol.d.ts

export enum MessageSource {
    CHROME_EXTENSION = 'chrome-extension',
    VSCODE_EXTENSION = 'vscode-extension',
    USER_INTERFACE = 'user-interface',
    SYSTEM = 'system'
}

export enum MessageType {
    // Connection & Generic
    CONNECTION_STATUS = 'CONNECTION_STATUS',
    ERROR_MESSAGE = 'ERROR_MESSAGE',
    SHOW_NOTIFICATION = 'SHOW_NOTIFICATION',

    // Chrome Extension -> VS Code
    SEND_BROWSER_CONTEXT = 'SEND_BROWSER_CONTEXT', // Sent from Chrome to VSCode with page details
    REQUEST_LLM_ACTION = 'REQUEST_LLM_ACTION',   // Sent from Chrome to VSCode to request an LLM action

    // VS Code -> Chrome Extension
    LLM_RESPONSE = 'LLM_RESPONSE',             // Sent from VSCode to Chrome with LLM output
    // Add other message types as needed
}

export interface BaseMessage {
    id: string; // Unique message ID
    source: MessageSource;
    timestamp: number;
    type: MessageType;
    correlationId?: string; // ID of the message this is a response to, if any
    payload?: any; // Specific payload depends on the message type
}

// --- Payloads for specific messages ---

// CONNECTION_STATUS
export interface ConnectionStatusPayload {
    status: 'connected' | 'disconnected' | 'error' | 'connecting';
    message?: string;
}
export interface ConnectionStatusMessage extends BaseMessage {
    type: MessageType.CONNECTION_STATUS;
    payload: ConnectionStatusPayload;
}

// ERROR_MESSAGE
export interface ErrorMessagePayload {
    message: string;
    details?: string;
    code?: string;
}
export interface ErrorMessage extends BaseMessage {
    type: MessageType.ERROR_MESSAGE;
    payload: ErrorMessagePayload;
}

// SHOW_NOTIFICATION (Example)
export interface ShowNotificationPayload {
    message: string;
    level?: 'info' | 'warning' | 'error';
}
export interface ShowNotificationMessage extends BaseMessage {
    type: MessageType.SHOW_NOTIFICATION;
    payload: ShowNotificationPayload;
}


// SEND_BROWSER_CONTEXT (Chrome -> VSCode)
export interface PageContext {
    url: string;
    title: string;
    selection?: string; // Selected text
    fullContent?: string; // Optional: Full page content (can be large)
    // Add other relevant context fields: active element, form data, etc.
}
export interface SendBrowserContextMessage extends BaseMessage {
    type: MessageType.SEND_BROWSER_CONTEXT;
    payload: PageContext;
}

// REQUEST_LLM_ACTION (Chrome -> VSCode)
export interface RequestLLMActionPayload {
    prompt: string;
    context?: PageContext; // Optional: context from the browser
    // Add other parameters: desired model, temperature, etc.
}
export interface RequestLLMActionMessage extends BaseMessage {
    type: MessageType.REQUEST_LLM_ACTION;
    payload: RequestLLMActionPayload;
}

// LLM_RESPONSE (VSCode -> Chrome)
export interface LLMResponsePayload {
    text?: string; // Main text response from LLM
    codeSnippet?: string; // If LLM generated code
    error?: string; // If an error occurred during LLM processing
    // Add other response fields: sources, confidence, etc.
}
export interface LLMResponseMessage extends BaseMessage {
    type: MessageType.LLM_RESPONSE;
    payload: LLMResponsePayload;
}
