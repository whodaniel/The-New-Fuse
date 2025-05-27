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
exports.WebViewMessageRouter = void 0;
const vscode = __importStar(require("vscode"));
class WebViewMessageRouter {
    constructor(relayService, llmManager) {
        this.relayService = relayService;
        this.llmManager = llmManager;
    }
    async handleMessage(message) {
        try {
            if (this.relayService.isRelayConnected()) {
                switch (message.type) {
                    case 'llm-request':
                        await this.handleLLMRequest(message);
                        break;
                    default:
                        this.relayService.sendMessageToWeb(message.text);
                }
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to process message: ${error.message}`);
        }
    }
    async handleLLMRequest(message) {
        try {
            const provider = this.llmManager.getCurrentProvider();
            if (!provider) {
                throw new Error('No LLM provider available');
            }
            const response = await provider.generateText(message.text, message.metadata);
            this.relayService.sendMessageToWeb(response.text);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to process with LLM: ${error.message}`);
        }
    }
}
exports.WebViewMessageRouter = WebViewMessageRouter;
//# sourceMappingURL=webview-message-router.js.map