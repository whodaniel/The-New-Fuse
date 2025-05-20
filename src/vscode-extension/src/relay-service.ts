import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { getLogger, ExtensionLogger } from './core/logging.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface WebViewMessage {
    type: string;
    data: any;
    metadata?: Record<string, any>;
}

export interface RelayWebview {
    webview: vscode.Webview;
    dispose(): void;
    isVisible?: boolean;
}

export class RelayService extends EventEmitter {
    private logger: ExtensionLogger; // Changed Logger to ExtensionLogger
    private webviewPanel?: RelayWebview;
    private static instance: RelayService;
    private isConnected: boolean = false;

    private constructor() {
        super();
        this.logger = getLogger(); // Changed Logger.getInstance() to getLogger()
    }

    public static getInstance(): RelayService {
        if (!RelayService.instance) {
            RelayService.instance = new RelayService();
        }
        return RelayService.instance;
    }

    setWebviewPanel(panel: vscode.WebviewPanel | vscode.WebviewView): void {
        // Create a common interface for both panel types
        this.webviewPanel = {
            webview: panel.webview,
            // Check if panel has dispose method before calling it
            dispose: () => {
                if ('dispose' in panel) {
                    (panel as vscode.WebviewPanel).dispose();
                }
                // WebviewView doesn't have a dispose method, but that's fine
                // as it's managed by VS Code
            },
            isVisible: 'visible' in panel ? panel.visible : true
        };

        // Set up message handling
        this.webviewPanel.webview.onDidReceiveMessage(
            (message: WebViewMessage) => {
                this.emit('messageReceived', message);
                this.logger.debug('Received message from webview:', message); // Changed log to debug
            },
            undefined,
            []
        );

        this.isConnected = true;
    }

    async sendMessageToWeb(message: WebViewMessage): Promise<void> {
        if (!this.webviewPanel) {
            throw new Error('No webview panel available');
        }

        try {
            await this.webviewPanel.webview.postMessage(message);
            this.logger.debug('Sent message to webview:', message); // Changed log to debug
        } catch (error) {
            this.logger.error('Failed to send message to webview:', error); // Changed log to error
            throw error;
        }
    }

    async loadWebviewContent(htmlPath: string): Promise<string> {
        try {
            if (!this.webviewPanel) {
                throw new Error('No webview panel available');
            }

            const htmlContent = await fs.readFile(htmlPath, 'utf8');
            
            // Convert webview-local resource paths
            const webviewHtml = htmlContent.replace(
                /(\s(?:src|href)=['"])([^'"]+)(['"])/g,
                (match, prefix, url, suffix) => {
                    if (url.startsWith('http')) {
                        return match;
                    }
                    const resourcePath = path.join(path.dirname(htmlPath), url);
                    const webviewUri = this.webviewPanel!.webview.asWebviewUri(
                        vscode.Uri.file(resourcePath)
                    );
                    return `${prefix}${webviewUri}${suffix}`;
                }
            );

            return webviewHtml;
        } catch (error) {
            this.logger.error('Failed to load webview content:', error); // Changed log to error
            throw error;
        }
    }

    isRelayConnected(): boolean {
        return this.isConnected && !!this.webviewPanel;
    }

    dispose(): void {
        this.removeAllListeners();
        if (this.webviewPanel) {
            this.webviewPanel.dispose();
            this.webviewPanel = undefined;
        }
        this.isConnected = false;
    }
}
