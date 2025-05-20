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
const React = __importStar(require("react"));
const ReactDOM = __importStar(require("react-dom"));
// Create the main ModelSelector component
const ModelSelector = () => {
    const [state, setState] = React.useState({
        providers: [],
        selectedProvider: null,
        models: [],
        apiKey: '',
        error: null,
        success: null,
    });
    // Handle provider selection
    const handleProviderSelect = (providerId) => {
        setState({ ...state, selectedProvider: providerId });
        // Send message to the extension
        const vscode = acquireVsCodeApi();
        vscode.postMessage({
            command: 'selectProvider',
            providerId
        });
    };
    // Handle model selection
    const handleModelSelect = (modelId) => {
        if (state.selectedProvider) {
            // Send message to the extension
            const vscode = acquireVsCodeApi();
            vscode.postMessage({
                command: 'selectModel',
                providerId: state.selectedProvider,
                modelId
            });
        }
    };
    // Handle API key input change
    const handleApiKeyChange = (e) => {
        setState({ ...state, apiKey: e.target.value });
    };
    // Handle API key save
    const handleSaveApiKey = () => {
        if (state.selectedProvider && state.apiKey) {
            // Send message to the extension
            const vscode = acquireVsCodeApi();
            vscode.postMessage({
                command: 'saveApiKey',
                providerId: state.selectedProvider,
                apiKey: state.apiKey
            });
        }
    };
    // Register global handlers for extension messages
    React.useEffect(() => {
        // Define functions that will be called from the webview script
        window.updateProviders = (providers) => {
            setState(prevState => ({ ...prevState, providers }));
        };
        window.updateModels = (providerId, models) => {
            setState(prevState => ({ ...prevState, models }));
        };
        window.showError = (message) => {
            setState(prevState => ({ ...prevState, error: message, success: null }));
        };
        window.showSuccess = (message) => {
            setState(prevState => ({ ...prevState, success: message, error: null }));
        };
    }, []);
    return (React.createElement("div", { className: "container" },
        React.createElement("div", { className: "header" },
            React.createElement("h1", null, "AI Model Selection"),
            React.createElement("p", null, "Select an AI provider and model to use with The Fuse")),
        state.error && React.createElement("div", { className: "error" }, state.error),
        state.success && React.createElement("div", { className: "success" }, state.success),
        React.createElement("div", { className: "panel" },
            React.createElement("h2", null, "Step 1: Select an AI Provider"),
            React.createElement("div", { className: "provider-list" }, state.providers.map(provider => (React.createElement("div", { key: provider.id, className: `model-card ${state.selectedProvider === provider.id ? 'selected' : ''}`, onClick: () => handleProviderSelect(provider.id) },
                React.createElement("div", { className: "model-name" }, provider.name),
                React.createElement("div", { className: "model-description" }, provider.description)))))),
        state.selectedProvider && (React.createElement(React.Fragment, null,
            state.providers.find(p => p.id === state.selectedProvider)?.requiresApiKey && (React.createElement("div", { className: "panel api-key-form" },
                React.createElement("h2", null, "API Key Configuration"),
                React.createElement("p", null,
                    "Enter your API key for ",
                    state.providers.find(p => p.id === state.selectedProvider)?.name),
                React.createElement("input", { type: "password", value: state.apiKey, onChange: handleApiKeyChange, placeholder: "Enter API key" }),
                React.createElement("button", { onClick: handleSaveApiKey }, "Save API Key"))),
            React.createElement("div", { className: "panel" },
                React.createElement("h2", null, "Step 2: Select a Model"),
                React.createElement("div", { className: "model-list" }, state.models.map(model => (React.createElement("div", { key: model.id, className: "model-card", onClick: () => handleModelSelect(model.id) },
                    React.createElement("div", { className: "model-name" }, model.name),
                    React.createElement("div", { className: "model-description" }, model.description))))))))));
};
// Render the component to the DOM
ReactDOM.render(React.createElement(ModelSelector, null), document.getElementById('root'));
//# sourceMappingURL=model-selector-react.js.map