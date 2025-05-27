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
exports.RooOutputMonitor = void 0;
const WebSocket = __importStar(require("ws"));
const roo_integration_1 = require("./roo-integration");
/**
 * Monitors Roo AI assistant output and manages communication with connected clients
 */
class RooOutputMonitor {
    constructor(connections) {
        this.rooIntegration = null;
        this.connections = connections;
    }
    /**
     * Start monitoring Roo output
     */
    startMonitoring() {
        if (this.rooIntegration) {
            return; // Already monitoring
        }
        this.rooIntegration = new roo_integration_1.RooIntegration();
        // Notify all connected clients that monitoring has started
        this.broadcastStatusUpdate(true);
    }
    /**
     * Stop monitoring and clean up resources
     */
    dispose() {
        if (this.rooIntegration) {
            this.rooIntegration.dispose();
            this.rooIntegration = null;
            // Notify all connected clients that monitoring has stopped
            this.broadcastStatusUpdate(false);
        }
    }
    /**
     * Send a status update to all connected WebSocket clients
     */
    broadcastStatusUpdate(isActive) {
        const message = JSON.stringify({
            type: 'roo_monitoring_status',
            active: isActive,
            timestamp: new Date().toISOString()
        });
        this.connections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }
    /**
     * Check if monitoring is currently active
     */
    isMonitoring() {
        return this.rooIntegration !== null;
    }
}
exports.RooOutputMonitor = RooOutputMonitor;
//# sourceMappingURL=roo-output-monitor.js.map