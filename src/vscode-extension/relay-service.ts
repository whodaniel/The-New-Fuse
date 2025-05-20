import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { Logger, LogLevel } from './src/core/logging.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface WebViewMessage {
    type: string;
    data: any;
    metadata?: any;
}

export class RelayService extends EventEmitter {
    private logger: Logger;
    private webviewPanel: vscode.WebviewPanel | undefined;
    private static instance: RelayService;

    private constructor() {
        super();
        this.logger = Logger.getInstance();
    }

    public static getInstance(): RelayService {
        if (!RelayService.instance) {
            RelayService.instance = new RelayService();
        }
        return RelayService.instance;
    }

    setWebviewPanel(panel: vscode.WebviewPanel | vscode.WebviewView): void {
        if ('webview' in panel) {
            // Handle WebviewView by treating it as a WebviewPanel-like object
            this.webviewPanel = {
                webview: panel.webview,
                reveal: () => {/* no-op for WebviewView */},
                dispose: panel.dispose.bind(panel)
            } as vscode.WebviewPanel;
        } else {
            this.webviewPanel = panel;
        }

        this.webviewPanel.webview.onDidReceiveMessage(
            (message: WebViewMessage) => {
                this.emit('messageReceived', message);
                this.logger.log(LogLevel.DEBUG, 'Received message from webview:', message);
            },
            undefined,
            []
        );
    }

    async sendMessageToWeb(message: WebViewMessage): Promise<void> {
        if (!this.webviewPanel) {
            throw new Error('No webview panel available');
        }

        try {
            await this.webviewPanel.webview.postMessage(message);
            this.logger.log(LogLevel.DEBUG, 'Sent message to webview:', message);
        } catch (error) {
            this.logger.log(LogLevel.ERROR, 'Failed to send message to webview:', error);
            throw error;
        }
    }

    async loadWebviewContent(htmlPath: string): Promise<string> {
        try {
            if (!this.webviewPanel) {
                throw new Error('No webview panel available');
            }

            const html = await fs.readFile(htmlPath, 'utf8');
            
            // Convert webview-local resource paths
            const webviewHtml = html.replace(
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
            this.logger.log(LogLevel.ERROR, 'Failed to load webview content:', error);
            throw error;
        }
    }

    dispose(): void {
        this.removeAllListeners();
        if (this.webviewPanel) {
            this.webviewPanel.dispose();
            this.webviewPanel = undefined;
        }
    }
}