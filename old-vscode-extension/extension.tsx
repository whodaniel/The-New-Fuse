/* eslint-disable */
import * as vscode from 'vscode';
import * as WebSocket from 'ws';
import { RooOutputMonitor } from './roo-output-monitor.js';

const AUTH_TOKEN = "YOUR_SECRET_AUTH_TOKEN"; // Replace with a secure token

export function activate(context: vscode.ExtensionContext): any {
    const connections: any[] = [];
    // Initialize Roo Output Monitor
    const rooMonitor = new RooOutputMonitor(connections);
    let monitoringActive = false;

    const wss = new WebSocket.Server({ port: 3710 });

    wss.on('connection', (ws) => {
        
        connections.push(ws);
        let isAuthenticated = false;

        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data.toString());

                if (message.type === "AUTH") {
                    if (message.token === AUTH_TOKEN) {
                        isAuthenticated = true;
                        ws.send(JSON.stringify({ type: "AUTH_RESPONSE", success: true }));
                    } else {
                        ws.send(JSON.stringify({ type: "AUTH_RESPONSE", success: false }));
                        ws.close();
                    }
                } else if (!isAuthenticated) {
                    console.warn("Received message without authentication. Closing connection.");
                    ws.close();
                } else if (message.type === "CODE_INPUT") {
                    const sanitizedCode = sanitizeCode(message.code);
                    try {
                        const aiOutput = await processWithAICoder(sanitizedCode);
                        ws.send(JSON.stringify({ type: "AI_OUTPUT", code: aiOutput }));
                    } catch (error: any) {
                        console.error('Error processing with AI coder:', error);
                        ws.send(JSON.stringify({ type: "ERROR", message: error.message }));
                    }
                } else if (message.type === "PING") {
                    ws.send(JSON.stringify({ type: "PONG" }));
                } else {
                    console.warn("Unhandled message type:", message.type);
                }
            } catch (error: any) {
                console.error('Error parsing message from Chrome extension:', error);
                ws.send(JSON.stringify({ type: "ERROR", message: error.message }));
            }
        });

        ws.on('close', () => {
            
        });
    });

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('roo.startMonitoring', () => {
            if (!monitoringActive) {
                rooMonitor.startMonitoring();
                monitoringActive = true;
                vscode.window.showInformationMessage('Roo output monitoring started.');
            } else {
                vscode.window.showInformationMessage('Roo output monitoring is already active.');
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('roo.stopMonitoring', () => {
            if (monitoringActive) {
                rooMonitor.dispose();
                monitoringActive = false;
                vscode.window.showInformationMessage('Roo output monitoring stopped.');
            } else {
                vscode.window.showInformationMessage('Roo output monitoring is not active.');
            }
        })
    );

    async function processWithAICoder(code: string): Promise<string> {
        // Placeholder for AI coder integration
        const doc = await vscode.workspace.openTextDocument({ content: code, language: 'javascript' });
        const editor = await vscode.window.showTextDocument(doc);

        // Replace with the actual command ID of your AI coder extension
        await vscode.commands.executeCommand('yourAICoderExtension.processCode');

        const result = editor.document.getText();
        return result;
    }

    function sanitizeCode(code: string): string {
        return code.replace(/</g, "<").replace(/>/g, ">");
    }
}

export function deactivate(): any {}