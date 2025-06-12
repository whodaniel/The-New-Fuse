export var MessageType;
(function (MessageType) {
    MessageType["REQUEST"] = "request";
    MessageType["RESPONSE"] = "response";
    MessageType["ERROR"] = "error";
    MessageType["EVENT"] = "event";
    MessageType["CONNECTION_STATUS"] = "CONNECTION_STATUS";
})(MessageType || (MessageType = {}));
export var MessageSource;
(function (MessageSource) {
    MessageSource["CHROME_EXTENSION_POPUP"] = "chrome-extension-popup";
    MessageSource["CHROME_EXTENSION_BACKGROUND"] = "chrome-extension-background";
    MessageSource["CHROME_EXTENSION_CONTENT"] = "chrome-extension-content";
    MessageSource["VSCODE_EXTENSION"] = "vscode-extension";
    MessageSource["VSCODE_WEBVIEW"] = "vscode-webview";
    MessageSource["USER"] = "user";
    MessageSource["AGENT_X"] = "agent-x";
})(MessageSource || (MessageSource = {}));
//# sourceMappingURL=shared-protocol.js.map