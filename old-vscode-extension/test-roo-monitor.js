"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RooMonitorTester = void 0;
exports.runRooMonitorTest = runRooMonitorTest;
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
const roo_output_monitor_1 = require("./roo-output-monitor");
const WebSocket = __importStar(require("ws"));
/**
 * This file provides a simple way to test the Roo monitoring system.
 * It creates a test output channel that simulates Roo Coder output
 * and verifies that the monitoring system correctly captures and forwards it.
 */
class RooMonitorTester {
    constructor() {
        this.testWs = null;
        this.monitor = null;
        this.outputChannel = vscode.window.createOutputChannel('Roo Test');
    }
    async startTest() {
        this.outputChannel.appendLine('Starting Roo monitor test...');
        // Create a test WebSocket client
        this.testWs = new WebSocket('ws://localhost:3710');
        this.testWs.on('open', () => {
            this.outputChannel.appendLine('Test WebSocket connected');
            // Authenticate with the server
            this.testWs.send(JSON.stringify({
                type: 'AUTH',
                token: 'YOUR_SECRET_AUTH_TOKEN' // Should match the token in extension.ts
            }));
            // Start the monitor with our test connection
            const connections = [this.testWs];
            this.monitor = new roo_output_monitor_1.RooOutputMonitor(connections);
            this.monitor.startMonitoring();
            // Generate some test output
            this.generateTestOutput();
        });
        this.testWs.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.outputChannel.appendLine(`Received message: ${JSON.stringify(message, null, 2)}`);
            }
            catch (error) {
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
    generateTestOutput() {
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
    dispose() {
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
exports.RooMonitorTester = RooMonitorTester;
// Command to run the test
function runRooMonitorTest() {
    const tester = new RooMonitorTester();
    tester.startTest();
    // Dispose after 10 seconds
    setTimeout(() => {
        tester.dispose();
    }, 10000);
}
suite('RooOutputMonitor Test Suite', () => {
    let connections = [];
    let monitor;
    setup(() => {
        connections = [];
        monitor = new roo_output_monitor_1.RooOutputMonitor(connections);
    });
    test('Monitor initialization', () => {
        assert.ok(monitor);
    });
    teardown(() => {
        monitor.dispose();
    });
});
//# sourceMappingURL=test-roo-monitor.js.map