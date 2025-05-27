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
exports.forceRegisterCommands = forceRegisterCommands;
const vscode = __importStar(require("vscode"));
/**
 * This function registers commands that are not already registered in the main extension.ts file.
 * It's primarily used for development and testing purposes.
 * For production use, commands should be registered through the CommandRegistry in extension.ts.
 */
function forceRegisterCommands() {
    // Note: Most commands are now registered in the main extension.ts file through CommandRegistry
    // This function only registers commands that might be needed for development/testing
    // Register communication panel command if not already registered
    vscode.commands.registerCommand('thefuse.openCommunicationPanel', () => {
        // Try to execute the command through the main command registry first
        vscode.commands.executeCommand('thefuse.openChatPanel')
            .then(() => { }, () => {
            // Fallback if the main command isn't available
            vscode.window.showInformationMessage('Opening Communication Hub...');
        });
    });
    // Register web UI command if not already registered
    vscode.commands.registerCommand('thefuse.openWebUI', () => {
        // Try to execute the command through the main command registry first
        vscode.commands.executeCommand('thefuse.openDashboard')
            .then(() => { }, () => {
            // Fallback if the main command isn't available
            vscode.window.showInformationMessage('Opening The New Fuse UI...');
        });
    });
    // Register file message command if not already registered
    vscode.commands.registerCommand('thefuse.sendFileMessage', (recipient, action, payload) => {
        // Try to use the communication manager from the main extension
        vscode.commands.executeCommand('thefuse.orchestrator.sendMessage', {
            sender: 'thefuse.main',
            recipient: recipient,
            action: action,
            payload: payload
        }).then(() => { }, () => {
            // Fallback if the main command isn't available
            vscode.window.showInformationMessage(`Sending message to ${recipient} via File Protocol...`);
        });
    });
    // Add status bar button for easy access
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
    statusBarItem.text = "$(rocket) The New Fuse";
    statusBarItem.tooltip = "The New Fuse Commands";
    statusBarItem.command = 'thefuse.startAICollab'; // Link to the main AI collaboration command
    statusBarItem.show();
    vscode.window.showInformationMessage('The New Fuse commands are now registered!');
    return 'Commands registered';
}
//# sourceMappingURL=direct-command-access.js.map