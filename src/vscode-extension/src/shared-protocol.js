// Shared protocol definitions for communication between Chrome extension and VS Code extension

export const MessageSource = {
    CHROME_EXTENSION: 'chrome-extension',
    VSCODE_EXTENSION: 'vscode-extension',
    USER_INTERFACE: 'user-interface',
    SYSTEM: 'system'
};

export const MessageType = {
    // Connection & Generic
    CONNECTION_STATUS: 'CONNECTION_STATUS',
    ERROR_MESSAGE: 'ERROR_MESSAGE',
    SHOW_NOTIFICATION: 'SHOW_NOTIFICATION',

    // Chrome Extension -> VS Code
    SEND_BROWSER_CONTEXT: 'SEND_BROWSER_CONTEXT', // Sent from Chrome to VSCode with page details
    REQUEST_LLM_ACTION: 'REQUEST_LLM_ACTION',   // Sent from Chrome to VSCode to request an LLM action

    // VS Code -> Chrome Extension
    LLM_RESPONSE: 'LLM_RESPONSE',             // Sent from VSCode to Chrome with LLM output
};
