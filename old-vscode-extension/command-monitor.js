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
exports.CommandMonitor = void 0;
const vscode = __importStar(require("vscode"));
const logging_1 = require("./core/logging");
class CommandMonitor {
    constructor() {
        this.disposables = [];
        this.logger = logging_1.Logger.getInstance();
        this.startMonitoring();
    }
    startMonitoring() {
        // Use command registration to monitor instead of onDidExecuteCommand
        this.registerCommandInterceptor('type');
        this.registerCommandInterceptor('editor.action.triggerSuggest');
    }
    registerCommandInterceptor(commandId) {
        this.disposables.push(vscode.commands.registerCommand(commandId, async (...args) => {
            this.onCommandExecuted({ command: commandId, args });
            // Execute original command
            return vscode.commands.executeCommand(`default:${commandId}`, ...args);
        }));
    }
    onCommandExecuted(data) {
        try {
            this.logger.info(`Command executed: ${data.command}`, data.args);
        }
        catch (error) {
            this.logger.error(`Error monitoring command: ${error}`);
        }
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}
exports.CommandMonitor = CommandMonitor;
//# sourceMappingURL=command-monitor.js.map