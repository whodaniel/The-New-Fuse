// Shared protocol definition for communication between Chrome extension and VS Code extension

export enum MessageSource {
  CHROME_EXTENSION_POPUP = 'chrome-extension-popup',
  CHROME_EXTENSION_BACKGROUND = 'chrome-extension-background',
  CHROME_EXTENSION_CONTENT = 'chrome-extension-content',
  VSCODE_EXTENSION = 'vscode-extension',
  VSCODE_WEBVIEW = 'vscode-webview',
  USER = 'user',
  AGENT_X = 'agent-x',
}

export enum MessageType {
  // Connection & Status
  CONNECTION_REQUEST = 'CONNECTION_REQUEST',
  CONNECTION_STATUS = 'CONNECTION_STATUS',
  HEARTBEAT = 'HEARTBEAT',
  ECHO_REQUEST = 'ECHO_REQUEST',
  ECHO_RESPONSE = 'ECHO_RESPONSE',

  // Data Exchange & Commands
  SEND_BROWSER_CONTEXT = 'SEND_BROWSER_CONTEXT',
  REQUEST_LLM_ACTION = 'REQUEST_LLM_ACTION',
  LLM_RESPONSE = 'LLM_RESPONSE',
  INSERT_CONTENT_IN_BROWSER = 'INSERT_CONTENT_IN_BROWSER',
  EXTRACT_CONTENT_FROM_BROWSER_REQUEST = 'EXTRACT_CONTENT_FROM_BROWSER_REQUEST',
  EXTRACT_CONTENT_FROM_BROWSER_RESPONSE = 'EXTRACT_CONTENT_FROM_BROWSER_RESPONSE',
  SHOW_NOTIFICATION = 'SHOW_NOTIFICATION',

  // Configuration & Settings
  SET_SHARED_SECRET_REQUEST = 'SET_SHARED_SECRET_REQUEST', // From UI to background/storage
  SHARED_SECRET_ACK = 'SHARED_SECRET_ACK', // Background to UI

  // Generic Error
  ERROR_MESSAGE = 'ERROR_MESSAGE',
}

export interface BaseMessage {
  id: string; // Generate with crypto.randomUUID() or similar
  source: MessageSource;
  timestamp: number; // ISO string or Unix timestamp
  type: MessageType;
  correlationId?: string; // To link responses to requests
}

export interface PageContext {
  url: string;
  title: string;
  selectedText?: string;
}

export interface SendBrowserContextMessage extends BaseMessage {
  type: MessageType.SEND_BROWSER_CONTEXT;
  payload: PageContext;
}

export interface RequestLLMActionMessage extends BaseMessage {
  type: MessageType.REQUEST_LLM_ACTION;
  payload: {
    prompt: string;
    context?: PageContext;
  };
}

export interface LLMResponseMessage extends BaseMessage {
  type: MessageType.LLM_RESPONSE;
  payload: {
    text?: string;
    codeSnippet?: string;
    htmlContent?: string;
    error?: string;
  };
}

export interface InsertContentInBrowserMessage extends BaseMessage {
  type: MessageType.INSERT_CONTENT_IN_BROWSER;
  payload: {
    targetElementQuery?: string;
    content: string; // Text or sanitized HTML
    mode: 'replace' | 'append' | 'prepend';
  };
}

export interface ErrorMessage extends BaseMessage {
  type: MessageType.ERROR_MESSAGE;
  payload: {
    message: string;
    details?: any;
    errorCode?: string;
  };
}

export interface ConnectionStatusMessage extends BaseMessage {
  type: MessageType.CONNECTION_STATUS;
  payload: {
    status: 'connected' | 'disconnected' | 'connecting' | 'error' | 'authenticating' | 'uninitialized';
    message?: string;
  };
}

export interface ExtractContentFromBrowserRequestMessage extends BaseMessage {
  type: MessageType.EXTRACT_CONTENT_FROM_BROWSER_REQUEST;
}

export interface ExtractContentFromBrowserResponseMessage extends BaseMessage {
  type: MessageType.EXTRACT_CONTENT_FROM_BROWSER_RESPONSE;
  payload: PageContext;
}

export interface SetSharedSecretRequestMessage extends BaseMessage {
  type: MessageType.SET_SHARED_SECRET_REQUEST;
  payload: {
    secret: string;
  };
}

export interface SharedSecretAckMessage extends BaseMessage {
  type: MessageType.SHARED_SECRET_ACK;
  payload: {
    success: boolean;
    message?: string;
  };
}
