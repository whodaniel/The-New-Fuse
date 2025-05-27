import * as vscode from 'vscode';
import { AIAgent, AIMessage, ConversationState, ConnectionStatus } from '../types/shared.js';
export declare function getCommunicationPanelContent(webview: vscode.Webview, extensionUri: vscode.Uri, agents: AIAgent[], conversations: ConversationState[], connectionStatus: Record<string, ConnectionStatus>): string;
export declare function getMessageHtml(message: AIMessage): string;
//# sourceMappingURL=webview-content.d.ts.map