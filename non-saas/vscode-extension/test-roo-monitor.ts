import * as assert from 'assert';
import * as vscode from 'vscode';
import { RooOutputMonitor } from './roo-output-monitor';
import * as WebSocket from 'ws';

/**
 * This file provides a simple way to test the Roo monitoring system.
 * It creates a test output channel that simulates Roo Coder output
 * and verifies that the monitoring system correctly captures and forwards it.
 */

export class RooMonitorTester {
    private outputChannel: vscode.OutputChannel;
    private testWs: WebSocket | null = null;
    private monitor: RooOutputMonitor | null = null;
    
    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Roo Test');
    }
    
    public async startTest() {
        this.outputChannel.appendLine('Starting Roo monitor test...');
        
        // Create a test WebSocket client
        this.testWs = new WebSocket('ws://localhost:3710');
        
        this.testWs.on('open', () => {
            this.outputChannel.appendLine('Test WebSocket connected');
            
            // Authenticate with the server
            this.testWs!.send(JSON.stringify({
                type: 'AUTH',
                token: 'YOUR_SECRET_AUTH_TOKEN' // Should match the token in extension.ts
            }));
            
            // Start the monitor with our test connection
            const connections: WebSocket[] = [this.testWs!];
            this.monitor = new RooOutputMonitor(connections);
            this.monitor.startMonitoring();
            
            // Generate some test output
            this.generateTestOutput();
        });
        
        this.testWs.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.outputChannel.appendLine(`Received message: ${JSON.stringify(message, null, 2)}`);
            } catch (error) {
                this.outputChannel.appendLine(`Error parsing message: ${error}`);
            }
        });
        
        this.testWs.on('error', (error) => {
            this.outputChannel.appendLine(`WebSocket error: ${error}`);
        });
        
        this.testWs.on('close', () => {
            this.outputChannel.appendLine('Test WebSocket closed');
        });
        
        this.outputChannel.show(true);
    }
    
    private generateTestOutput() {
        // Create a test output channel that simulates Roo output
        const testRooChannel = vscode.window.createOutputChannel('Roo Code');
        
        // Generate some test output
        setTimeout(() => {
            testRooChannel.appendLine('[Roo Coder]: Hello, I\'m Roo Coder!');
        }, 1000);
        
        setTimeout(() => {
            testRooChannel.appendLine('[Roo Coder]: I\'m analyzing your code...');
        }, 2000);
        
        setTimeout(() => {
            testRooChannel.appendLine('Some other output that mentions Roo but isn\'t direct output');
        }, 3000);
        
        setTimeout(() => {
            testRooChannel.appendLine('[Roo Coder]: I\'ve completed the analysis.');
        }, 4000);
        
        testRooChannel.show(true);
    }
    
    public dispose() {
        if (this.monitor) {
            this.monitor.dispose();
            this.monitor = null;
        }
        
        if (this.testWs && this.testWs.readyState === WebSocket.OPEN) {
            this.testWs.close();
            this.testWs = null;
        }
        
        this.outputChannel.dispose();
    }
}

// Command to run the test
export function runRooMonitorTest(): any {
    const tester = new RooMonitorTester();
    tester.startTest();
    
    // Dispose after 10 seconds
    setTimeout(() => {
        tester.dispose();
    }, 10000);
}

suite('RooOutputMonitor Test Suite', () => {
    let connections: WebSocket[] = [];
    let monitor: RooOutputMonitor;

    setup(() => {
        connections = [];
        monitor = new RooOutputMonitor(connections);
    });

    test('Monitor initialization', () => {
        assert.ok(monitor);
    });

    teardown(() => {
        monitor.dispose();
    });
});