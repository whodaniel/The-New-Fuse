/**
 * WebSocket protocol shared between extension and client
 */
export interface WebSocketMessage {
  type: string;
  payload: unknown;
  id?: string;
  error?: string;
}

export enum MessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  ERROR = 'error',
  EVENT = 'event',
  CONNECTION_STATUS = 'CONNECTION_STATUS'
}

export enum MessageSource {
  CHROME_EXTENSION_POPUP = 'chrome-extension-popup',
  CHROME_EXTENSION_BACKGROUND = 'chrome-extension-background',
  CHROME_EXTENSION_CONTENT = 'chrome-extension-content',
  VSCODE_EXTENSION = 'vscode-extension',
  VSCODE_WEBVIEW = 'vscode-webview',
  USER = 'user',
  AGENT_X = 'agent-x'
}

export interface WebSocketRequest extends WebSocketMessage {
  type: MessageType.REQUEST;
  command: string;
  payload: unknown;
}

export interface WebSocketResponse extends WebSocketMessage {
  type: MessageType.RESPONSE;
  id: string;
  payload: unknown;
}

export interface WebSocketError extends WebSocketMessage {
  type: MessageType.ERROR;
  id?: string;
  error: string;
}

export interface WebSocketEvent extends WebSocketMessage {
  type: MessageType.EVENT;
  event: string;
  payload: unknown;
}

export interface ConnectionStatusMessage extends WebSocketMessage {
  type: MessageType.CONNECTION_STATUS;
  payload: {
    status: 'connected' | 'disconnected' | 'connecting' | 'error' | 'authenticating' | 'uninitialized';
    message?: string;
  };
}
