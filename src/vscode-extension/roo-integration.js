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
exports.RooIntegration = void 0;
const vscode = __importStar(require("vscode"));
const ws_1 = require("ws");
const ROO_OUTPUT_PORT = 3711;
/**
 * Integration with the Roo Code AI assistant
 * Monitors Roo's output channel and broadcasts it via WebSocket
 */
class RooIntegration {
    constructor() {
        this.connections = new Set();
        this.wss = new ws_1.WebSocketServer({ port: ROO_OUTPUT_PORT });
        this.setupWebSocketServer();
        this.interceptRooOutput();
    }
    setupWebSocketServer() {
        this.wss.on('connection', (ws) => {
            this.connections.add(ws);
            ws.on('close', () => {
                this.connections.delete(ws);
            });
        });
    }
    interceptRooOutput() {
        // Subscribe to Roo's output channel
        const rooOutputChannel = vscode.window.createOutputChannel('Roo Code');
        // Monitor Roo's output by intercepting its channel
        const originalAppend = rooOutputChannel.append;
        rooOutputChannel.append = (value) => {
            // Forward the output to all connected clients
            this.broadcastOutput(value);
            // Call the original append method
            originalAppend.call(rooOutputChannel, value);
        };
        const originalAppendLine = rooOutputChannel.appendLine;
        rooOutputChannel.appendLine = (value) => {
            // Forward the output to all connected clients
            this.broadcastOutput(value + '\n');
            // Call the original appendLine method
            originalAppendLine.call(rooOutputChannel, value);
        };
    }
    broadcastOutput(output) {
        const message = JSON.stringify({
            type: 'roo_output',
            content: output,
            timestamp: new Date().toISOString()
        });
        this.connections.forEach(ws => {
            if (ws.readyState === ws_1.WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }
    dispose() {
        this.wss.close();
    }
}
exports.RooIntegration = RooIntegration;
//# sourceMappingURL=roo-integration.js.map