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
exports.RelayPanelProvider = void 0;
const path = __importStar(require("path"));
const logging_1 = require("./src/core/logging");
const relay_service_1 = require("./relay-service");
class RelayPanelProvider {
    constructor(extensionUri) {
        this._extensionUri = extensionUri;
        this.logger = logging_1.Logger.getInstance();
        this.relayService = relay_service_1.RelayService.getInstance();
    }
    resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        this.relayService.setWebviewPanel(webviewView);
        // Listen for relay service messages
        this.relayService.on('messageReceived', (message) => {
            this.handleMessage(message);
        });
        // Initial setup
        this.setupWebview();
    }
    async setupWebview() {
        if (!this._view) {
            return;
        }
        try {
            const htmlPath = path.join(this._extensionUri.fsPath, 'media', 'relay-panel.html');
            let htmlContent = await this.relayService.loadWebviewContent(htmlPath);
            // Set up webview content
            this._view.webview.html = htmlContent;
        }
        catch (error) {
            this.logger.log(logging_1.LogLevel.ERROR, 'Failed to setup webview:', error);
            throw error;
        }
    }
    async handleMessage(message) {
        try {
            switch (message.type) {
                case 'send':
                    await this.relayService.sendMessageToWeb({
                        type: 'message',
                        data: message.data
                    });
                    break;
                // Add other message type handlers as needed
                default:
                    this.logger.log(logging_1.LogLevel.WARN, `Unknown message type: ${message.type}`);
            }
        }
        catch (error) {
            this.logger.log(logging_1.LogLevel.ERROR, 'Failed to handle message:', error);
            throw error;
        }
    }
    revive(panel) {
        this._view = panel;
    }
}
exports.RelayPanelProvider = RelayPanelProvider;
//# sourceMappingURL=relay-panel-provider.js.map