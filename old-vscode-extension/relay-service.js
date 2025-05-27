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
exports.RelayService = void 0;
const vscode = __importStar(require("vscode"));
const events_1 = require("events");
const logging_1 = require("./src/core/logging");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class RelayService extends events_1.EventEmitter {
    constructor() {
        super();
        this.logger = logging_1.Logger.getInstance();
    }
    static getInstance() {
        if (!RelayService.instance) {
            RelayService.instance = new RelayService();
        }
        return RelayService.instance;
    }
    setWebviewPanel(panel) {
        if ('webview' in panel) {
            // Handle WebviewView by treating it as a WebviewPanel-like object
            this.webviewPanel = {
                webview: panel.webview,
                reveal: () => { },
                dispose: panel.dispose.bind(panel)
            };
        }
        else {
            this.webviewPanel = panel;
        }
        this.webviewPanel.webview.onDidReceiveMessage((message) => {
            this.emit('messageReceived', message);
            this.logger.log(logging_1.LogLevel.DEBUG, 'Received message from webview:', message);
        }, undefined, []);
    }
    async sendMessageToWeb(message) {
        if (!this.webviewPanel) {
            throw new Error('No webview panel available');
        }
        try {
            await this.webviewPanel.webview.postMessage(message);
            this.logger.log(logging_1.LogLevel.DEBUG, 'Sent message to webview:', message);
        }
        catch (error) {
            this.logger.log(logging_1.LogLevel.ERROR, 'Failed to send message to webview:', error);
            throw error;
        }
    }
    async loadWebviewContent(htmlPath) {
        try {
            if (!this.webviewPanel) {
                throw new Error('No webview panel available');
            }
            const html = await fs.readFile(htmlPath, 'utf8');
            // Convert webview-local resource paths
            const webviewHtml = html.replace(/(\s(?:src|href)=['"])([^'"]+)(['"])/g, (match, prefix, url, suffix) => {
                if (url.startsWith('http')) {
                    return match;
                }
                const resourcePath = path.join(path.dirname(htmlPath), url);
                const webviewUri = this.webviewPanel.webview.asWebviewUri(vscode.Uri.file(resourcePath));
                return `${prefix}${webviewUri}${suffix}`;
            });
            return webviewHtml;
        }
        catch (error) {
            this.logger.log(logging_1.LogLevel.ERROR, 'Failed to load webview content:', error);
            throw error;
        }
    }
    dispose() {
        this.removeAllListeners();
        if (this.webviewPanel) {
            this.webviewPanel.dispose();
            this.webviewPanel = undefined;
        }
    }
}
exports.RelayService = RelayService;
//# sourceMappingURL=relay-service.js.map