/// <reference types="node" />
import * as vscode from 'vscode';
import { EventEmitter } from 'events';
export interface WebViewMessage {
    type: string;
    data: any;
    metadata?: any;
}
export declare class RelayService extends EventEmitter {
    private logger;
    private webviewPanel;
    private static instance;
    private constructor();
    static getInstance(): RelayService;
    setWebviewPanel(panel: vscode.WebviewPanel | vscode.WebviewView): void;
    sendMessageToWeb(message: WebViewMessage): Promise<void>;
    loadWebviewContent(htmlPath: string): Promise<string>;
    dispose(): void;
}
//# sourceMappingURL=relay-service.d.ts.map