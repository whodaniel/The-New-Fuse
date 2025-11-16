import * as vscode from 'vscode';
import * as WebSocket from 'ws';

export class RooOutputMonitor {
    private disposable: vscode.Disposable | undefined;
    private connections: WebSocket[];

    constructor(connections: WebSocket[]) {
        this.connections = connections;
    }

    public startMonitoring(): void {
        // Register a command that starts monitoring
        this.disposable = vscode.workspace.onDidChangeTextDocument(this.onTextDocumentChanged.bind(this));
    }

    private onTextDocumentChanged(event: vscode.TextDocumentChangeEvent): void {
        const document = event.document;
        const changes = event.contentChanges;

        if (changes.length > 0) {
            this.connections.forEach(connection => {
                if (connection.readyState === WebSocket.OPEN) {
                    connection.send(JSON.stringify({
                        type: 'DOCUMENT_CHANGE',
                        file: document.fileName,
                        content: document.getText()
                    }));
                }
            });
        }
    }

    public dispose(): void {
        if (this.disposable) {
            this.disposable.dispose();
        }
    }
}