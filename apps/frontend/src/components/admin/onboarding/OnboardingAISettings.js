var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { OnboardingAdminService } from '../../../services/onboarding-admin.service';
import { CheckCircle, XCircle, AlertTriangle, Info, ChevronDown } from 'lucide-react';
export var OnboardingAISettings = function (_a) {
    var onSave = _a.onSave, onChange = _a.onChange, hasUnsavedChanges = _a.hasUnsavedChanges;
    var _b = useState('rag'), activeTab = _b[0], setActiveTab = _b[1];
    var _c = useState(false), showVectorConfig = _c[0], setShowVectorConfig = _c[1];
    var _d = useState(null), notification = _d[0], setNotification = _d[1];
    var showNotification = function (type, title, description) {
        setNotification({ type: type, title: title, description: description });
        setTimeout(function () { return setNotification(null); }, 5000);
    };
    var _e = useState({
        // RAG Settings
        ragEnabled: true,
        defaultEmbeddingModel: 'text-embedding-3-large',
        vectorDatabaseType: 'pinecone',
        vectorDatabaseConfig: {
            pineconeApiKey: '',
            pineconeEnvironment: '',
            pineconeIndex: 'onboarding-knowledge'
        },
        // LLM Settings
        defaultLLMProvider: 'openai',
        defaultLLMModel: 'gpt-4',
        defaultTemperature: 0.7,
        defaultMaxTokens: 1000,
        // Greeter Agent Settings
        greeterAgentEnabled: true,
        greeterAgentName: 'Fuse Assistant',
        greeterAgentAvatar: '/assets/images/greeter-avatar.png',
        greeterAgentPrompt: 'You are Fuse Assistant, a helpful AI assistant designed to help users get started with The New Fuse platform. Your goal is to be friendly, informative, and guide users through the onboarding process.',
        greeterAgentKnowledgeBase: [
            {
                id: 'kb-1',
                name: 'Platform Overview',
                description: 'General information about The New Fuse platform',
                enabled: true
            },
            {
                id: 'kb-2',
                name: 'Getting Started Guide',
                description: 'Step-by-step guide for new users',
                enabled: true
            },
            {
                id: 'kb-3',
                name: 'FAQ',
                description: 'Frequently asked questions',
                enabled: true
            }
        ],
        // Multimodal Settings
        multimodalEnabled: true,
        supportedModalities: ['text', 'image', 'audio'],
        imageAnalysisModel: 'gpt-4-vision',
        audioTranscriptionModel: 'whisper-large-v3',
        // Advanced Settings
        enableDebugMode: false,
        logUserInteractions: true,
        maxConcurrentRequests: 5,
        requestTimeout: 30,
        fallbackBehavior: 'graceful-degradation'
    }), settings = _e[0], setSettings = _e[1];
    var _f = useState(true), isLoading = _f[0], setIsLoading = _f[1];
    var _g = useState(null), error = _g[0], setError = _g[1];
    // Fetch AI settings from API
    useEffect(function () {
        var fetchAISettings = function () { return __awaiter(void 0, void 0, void 0, function () {
            var data, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, 3, 4]);
                        setIsLoading(true);
                        setError(null);
                        return [4 /*yield*/, OnboardingAdminService.getAISettings()];
                    case 1:
                        data = _a.sent();
                        setSettings(data);
                        return [3 /*break*/, 4];
                    case 2:
                        err_1 = _a.sent();
                        console.error('Error fetching AI settings:', err_1);
                        setError('Failed to load AI settings. Please try again.');
                        return [3 /*break*/, 4];
                    case 3:
                        setIsLoading(false);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        fetchAISettings();
    }, []);
    var handleInputChange = function (e) {
        var _a, _b, _c;
        var _d = e.target, name = _d.name, value = _d.value;
        // Handle nested properties
        if (name.includes('.')) {
            var _e = name.split('.'), parent_1 = _e[0], child = _e[1];
            setSettings(__assign(__assign({}, settings), (_a = {}, _a[parent_1] = __assign(__assign({}, settings[parent_1]), (_b = {}, _b[child] = value, _b)), _a)));
        }
        else {
            setSettings(__assign(__assign({}, settings), (_c = {}, _c[name] = value, _c)));
        }
        onChange();
    };
    var handleSwitchChange = function (name, checked) {
        var _a, _b, _c;
        // Handle nested properties
        if (name.includes('.')) {
            var _d = name.split('.'), parent_2 = _d[0], child = _d[1];
            setSettings(__assign(__assign({}, settings), (_a = {}, _a[parent_2] = __assign(__assign({}, settings[parent_2]), (_b = {}, _b[child] = checked, _b)), _a)));
        }
        else {
            setSettings(__assign(__assign({}, settings), (_c = {}, _c[name] = checked, _c)));
        }
        onChange();
    };
    var handleSliderChange = function (name, value) {
        var _a;
        setSettings(__assign(__assign({}, settings), (_a = {}, _a[name] = value, _a)));
        onChange();
    };
    var handleSaveChanges = function () { return __awaiter(void 0, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, OnboardingAdminService.updateAISettings(settings)];
                case 1:
                    _a.sent();
                    onSave();
                    showNotification('success', 'Changes saved', 'AI settings have been saved successfully.');
                    return [3 /*break*/, 3];
                case 2:
                    err_2 = _a.sent();
                    console.error('Error saving AI settings:', err_2);
                    showNotification('error', 'Error saving changes', 'There was an error saving your changes. Please try again.');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var handleToggleKnowledgeBase = function (id) {
        setSettings(__assign(__assign({}, settings), { greeterAgentKnowledgeBase: settings.greeterAgentKnowledgeBase.map(function (kb) {
                return kb.id === id ? __assign(__assign({}, kb), { enabled: !kb.enabled }) : kb;
            }) }));
        onChange();
    };
    return (_jsxs("div", { className: "space-y-6", children: [notification && (_jsx("div", { className: "p-4 rounded-md border ".concat(notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                    notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                        notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                            'bg-blue-50 border-blue-200 text-blue-800'), children: _jsxs("div", { className: "flex", children: [_jsxs("div", { className: "flex-shrink-0", children: [notification.type === 'success' && (_jsx(CheckCircle, { className: "h-5 w-5 text-green-400" })), notification.type === 'error' && (_jsx(XCircle, { className: "h-5 w-5 text-red-400" })), notification.type === 'warning' && (_jsx(AlertTriangle, { className: "h-5 w-5 text-yellow-400" })), notification.type === 'info' && (_jsx(Info, { className: "h-5 w-5 text-blue-400" }))] }), _jsxs("div", { className: "ml-3", children: [_jsx("h3", { className: "text-sm font-medium", children: notification.title }), notification.description && (_jsx("p", { className: "mt-1 text-sm", children: notification.description }))] })] }) })), _jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-6", children: "AI Settings for Onboarding" }), _jsx("p", { className: "text-gray-600 mb-6", children: "Configure the AI capabilities used during the onboarding process, including RAG settings, LLM configuration, and the Greeter Agent behavior." }), isLoading && (_jsxs("div", { className: "text-center py-10", children: [_jsx("div", { className: "inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" }), _jsx("p", { className: "text-gray-600", children: "Loading AI settings..." })] })), error && !isLoading && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-md p-4 mb-4", children: _jsxs("div", { className: "flex", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(XCircle, { className: "h-5 w-5 text-red-400" }) }), _jsxs("div", { className: "ml-3 flex-1", children: [_jsx("h3", { className: "text-sm font-medium text-red-800", children: "Error Loading Settings" }), _jsx("p", { className: "mt-1 text-sm text-red-700", children: error })] }), _jsx("div", { className: "ml-3", children: _jsx("button", { onClick: function () { return window.location.reload(); }, className: "bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium", children: "Retry" }) })] }) })), !isLoading && !error && (_jsxs("div", { className: "mb-6", children: [_jsx("div", { className: "border-b border-gray-200", children: _jsx("nav", { className: "-mb-px flex space-x-8", children: [
                                { id: 'rag', label: 'RAG Settings' },
                                { id: 'llm', label: 'LLM Settings' },
                                { id: 'greeter', label: 'Greeter Agent' },
                                { id: 'multimodal', label: 'Multimodal' },
                                { id: 'advanced', label: 'Advanced' }
                            ].map(function (tab) { return (_jsx("button", { onClick: function () { return setActiveTab(tab.id); }, className: "py-2 px-1 border-b-2 font-medium text-sm ".concat(activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'), children: tab.label }, tab.id)); }) }) }), _jsxs("div", { className: "mt-6", children: [activeTab === 'rag' && (_jsxs("div", { className: "bg-white border border-gray-200 rounded-lg shadow-sm mb-4", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: _jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Retrieval Augmented Generation (RAG)" }) }), _jsxs("div", { className: "px-6 py-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("label", { className: "text-sm font-medium text-gray-700", children: "Enable RAG" }), _jsx("button", { type: "button", onClick: function () { return handleSwitchChange('ragEnabled', !settings.ragEnabled); }, className: "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ".concat(settings.ragEnabled ? 'bg-blue-600' : 'bg-gray-200'), "aria-label": "Enable RAG", children: _jsx("span", { className: "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ".concat(settings.ragEnabled ? 'translate-x-5' : 'translate-x-0') }) })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { htmlFor: "embeddingModel", className: "block text-sm font-medium text-gray-700 mb-2", children: "Embedding Model" }), _jsxs("select", { id: "embeddingModel", name: "embeddingModel", value: settings.embeddingModel, onChange: handleInputChange, className: "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", children: [_jsx("option", { value: "text-embedding-ada-002", children: "Ada v2 (OpenAI)" }), _jsx("option", { value: "text-embedding-3-large", children: "Embedding 3 Large (OpenAI)" }), _jsx("option", { value: "text-embedding-3-small", children: "Embedding 3 Small (OpenAI)" })] })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { htmlFor: "vectorDatabase", className: "block text-sm font-medium text-gray-700 mb-2", children: "Vector Database" }), _jsxs("select", { id: "vectorDatabase", name: "vectorDatabaseType", value: settings.vectorDatabaseType, onChange: handleInputChange, className: "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", children: [_jsx("option", { value: "pinecone", children: "Pinecone" }), _jsx("option", { value: "weaviate", children: "Weaviate" }), _jsx("option", { value: "qdrant", children: "Qdrant" })] })] }), _jsxs("div", { className: "border-t border-gray-200 pt-4", children: [_jsxs("button", { onClick: function () { return setVectorDbConfigOpen(!vectorDbConfigOpen); }, className: "flex justify-between items-center w-full text-left", "aria-expanded": vectorDbConfigOpen, children: [_jsx("h4", { className: "text-md font-medium text-gray-900", children: "Vector Database Configuration" }), _jsx(ChevronDown, { className: "w-5 h-5 transform transition-transform ".concat(vectorDbConfigOpen ? 'rotate-180' : '') })] }), vectorDbConfigOpen && (_jsxs("div", { className: "mt-4", children: [settings.vectorDatabaseType === 'pinecone' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Pinecone API Key" }), _jsx("input", { name: "vectorDatabaseConfig.pineconeApiKey", value: settings.vectorDatabaseConfig.pineconeApiKey, onChange: handleInputChange, type: "password", placeholder: "Enter your Pinecone API key", className: "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Pinecone Environment" }), _jsx("input", { name: "vectorDatabaseConfig.pineconeEnvironment", value: settings.vectorDatabaseConfig.pineconeEnvironment, onChange: handleInputChange, placeholder: "e.g., us-west1-gcp", className: "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Pinecone Index" }), _jsx("input", { name: "vectorDatabaseConfig.pineconeIndex", value: settings.vectorDatabaseConfig.pineconeIndex, onChange: handleInputChange, placeholder: "e.g., onboarding-knowledge", className: "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" })] })] })), settings.vectorDatabaseType !== 'pinecone' && (_jsxs("p", { className: "text-gray-500", children: ["Configuration for ", settings.vectorDatabaseType, " will be available in a future update."] }))] }))] })] })] })), activeTab === 'llm' && (_jsxs("div", { className: "bg-white border border-gray-200 rounded-lg shadow-sm mb-4", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: _jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Language Model Settings" }) }), _jsxs("div", { className: "px-6 py-4", children: [_jsxs("div", { className: "mb-4", children: [_jsx("label", { htmlFor: "defaultLLMProvider", className: "block text-sm font-medium text-gray-700 mb-2", children: "Default LLM Provider" }), _jsxs("select", { id: "defaultLLMProvider", name: "defaultLLMProvider", value: settings.defaultLLMProvider, onChange: handleInputChange, className: "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", children: [_jsx("option", { value: "openai", children: "OpenAI" }), _jsx("option", { value: "anthropic", children: "Anthropic" }), _jsx("option", { value: "google", children: "Google AI" }), _jsx("option", { value: "azure", children: "Azure OpenAI" }), _jsx("option", { value: "mistral", children: "Mistral AI" })] }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "The default provider for language models" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { htmlFor: "defaultLLMModel", className: "block text-sm font-medium text-gray-700 mb-2", children: "Default Model" }), _jsxs("select", { id: "defaultLLMModel", name: "defaultLLMModel", value: settings.defaultLLMModel, onChange: handleInputChange, className: "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", children: [settings.defaultLLMProvider === 'openai' && (_jsxs(_Fragment, { children: [_jsx("option", { value: "gpt-4", children: "GPT-4" }), _jsx("option", { value: "gpt-4-turbo", children: "GPT-4 Turbo" }), _jsx("option", { value: "gpt-3.5-turbo", children: "GPT-3.5 Turbo" })] })), settings.defaultLLMProvider === 'anthropic' && (_jsxs(_Fragment, { children: [_jsx("option", { value: "claude-3-opus", children: "Claude 3 Opus" }), _jsx("option", { value: "claude-3-sonnet", children: "Claude 3 Sonnet" }), _jsx("option", { value: "claude-3-haiku", children: "Claude 3 Haiku" })] })), settings.defaultLLMProvider === 'google' && (_jsxs(_Fragment, { children: [_jsx("option", { value: "gemini-pro", children: "Gemini Pro" }), _jsx("option", { value: "gemini-ultra", children: "Gemini Ultra" })] })), settings.defaultLLMProvider === 'azure' && (_jsxs(_Fragment, { children: [_jsx("option", { value: "gpt-4", children: "Azure GPT-4" }), _jsx("option", { value: "gpt-35-turbo", children: "Azure GPT-3.5 Turbo" })] })), settings.defaultLLMProvider === 'mistral' && (_jsxs(_Fragment, { children: [_jsx("option", { value: "mistral-large", children: "Mistral Large" }), _jsx("option", { value: "mistral-medium", children: "Mistral Medium" }), _jsx("option", { value: "mistral-small", children: "Mistral Small" })] }))] }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "The default language model to use" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { htmlFor: "defaultTemperature", className: "block text-sm font-medium text-gray-700 mb-2", children: "Default Temperature" }), _jsxs("div", { className: "flex items-center", children: [_jsx("input", { id: "defaultTemperature", type: "range", value: settings.defaultTemperature, onChange: function (e) { return handleSliderChange('defaultTemperature', parseFloat(e.target.value)); }, step: "0.1", min: "0", max: "1", className: "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer", "aria-label": "Default Temperature" }), _jsx("input", { type: "number", value: settings.defaultTemperature, onChange: function (e) { return handleSliderChange('defaultTemperature', parseFloat(e.target.value)); }, step: "0.1", min: "0", max: "1", className: "w-20 px-2 py-1 border border-gray-300 rounded text-sm", "aria-label": "Default Temperature Value" })] }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Controls randomness: 0 is deterministic, 1 is more creative" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { htmlFor: "defaultMaxTokens", className: "block text-sm font-medium text-gray-700 mb-2", children: "Default Max Tokens" }), _jsx("input", { type: "number", id: "defaultMaxTokens", value: settings.defaultMaxTokens, onChange: function (e) { return handleSliderChange('defaultMaxTokens', parseInt(e.target.value)); }, min: "100", max: "8000", step: "100", className: "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Maximum number of tokens to generate in responses" })] })] })] })), activeTab === 'greeter' && (_jsxs("div", { className: "bg-white border border-gray-200 rounded-lg shadow-sm mb-4", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: _jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Greeter Agent Configuration" }) }), _jsxs("div", { className: "px-6 py-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("label", { htmlFor: "greeterAgentEnabled", className: "text-sm font-medium text-gray-700", children: "Enable Greeter Agent" }), _jsx("button", { type: "button", id: "greeterAgentEnabled", onClick: function () { return handleSwitchChange('greeterAgentEnabled', !settings.greeterAgentEnabled); }, className: "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ".concat(settings.greeterAgentEnabled ? 'bg-blue-600' : 'bg-gray-200'), "aria-label": "Enable Greeter Agent", children: _jsx("span", { className: "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ".concat(settings.greeterAgentEnabled ? 'translate-x-5' : 'translate-x-0') }) })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { htmlFor: "greeterAgentName", className: "block text-sm font-medium text-gray-700 mb-2", children: "Agent Name" }), _jsx("input", { name: "greeterAgentName", id: "greeterAgentName", value: settings.greeterAgentName, onChange: handleInputChange, className: "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { htmlFor: "greeterAgentAvatar", className: "block text-sm font-medium text-gray-700 mb-2", children: "Agent Avatar URL" }), _jsx("input", { name: "greeterAgentAvatar", id: "greeterAgentAvatar", value: settings.greeterAgentAvatar, onChange: handleInputChange, className: "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { htmlFor: "greeterAgentPrompt", className: "block text-sm font-medium text-gray-700 mb-2", children: "System Prompt" }), _jsx("textarea", { name: "greeterAgentPrompt", id: "greeterAgentPrompt", value: settings.greeterAgentPrompt, onChange: handleInputChange, rows: 5, className: "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "The system prompt that defines the greeter agent's behavior and personality" })] }), _jsx("h4", { className: "text-sm font-medium text-gray-900 mb-2", children: "Knowledge Base" }), _jsx("p", { className: "text-sm text-gray-500 mb-2", children: "Select the knowledge bases that the greeter agent can access" }), _jsx("div", { className: "space-y-2 mb-4", children: settings.greeterAgentKnowledgeBase.map(function (kb) { return (_jsxs("div", { className: "flex items-center justify-between p-2 border border-gray-200 rounded-md", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium text-gray-900", children: kb.name }), _jsx("div", { className: "text-sm text-gray-500", children: kb.description })] }), _jsx("button", { type: "button", onClick: function () { return handleToggleKnowledgeBase(kb.id); }, className: "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ".concat(kb.enabled ? 'bg-blue-600' : 'bg-gray-200'), "aria-label": "Enable ".concat(kb.name, " Knowledge Base"), children: _jsx("span", { className: "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ".concat(kb.enabled ? 'translate-x-5' : 'translate-x-0') }) })] }, kb.id)); }) })] })] })), activeTab === 'multimodal' && (_jsxs("div", { className: "bg-white border border-gray-200 rounded-lg shadow-sm mb-4", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: _jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Multimodal Settings" }) }), _jsxs("div", { className: "px-6 py-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("label", { htmlFor: "multimodalEnabled", className: "text-sm font-medium text-gray-700", children: "Enable Multimodal Support" }), _jsx("button", { type: "button", id: "multimodalEnabled", onClick: function () { return handleSwitchChange('multimodalEnabled', !settings.multimodalEnabled); }, className: "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ".concat(settings.multimodalEnabled ? 'bg-blue-600' : 'bg-gray-200'), "aria-label": "Enable Multimodal Support", children: _jsx("span", { className: "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ".concat(settings.multimodalEnabled ? 'translate-x-5' : 'translate-x-0') }) })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Supported Modalities" }), _jsx("div", { className: "flex flex-wrap gap-2", children: ['text', 'image', 'audio', 'video'].map(function (modality) { return (_jsx("button", { type: "button", onClick: function () {
                                                                var newModalities = settings.supportedModalities.includes(modality)
                                                                    ? settings.supportedModalities.filter(function (m) { return m !== modality; })
                                                                    : __spreadArray(__spreadArray([], settings.supportedModalities, true), [modality], false);
                                                                setSettings(__assign(__assign({}, settings), { supportedModalities: newModalities }));
                                                                onChange();
                                                            }, className: "px-3 py-1 text-sm font-medium rounded-md border ".concat(settings.supportedModalities.includes(modality)
                                                                ? 'bg-blue-100 border-blue-300 text-blue-800'
                                                                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'), "aria-label": "Enable ".concat(modality, " modality"), children: modality.charAt(0).toUpperCase() + modality.slice(1) }, modality)); }) })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { htmlFor: "imageAnalysisModel", className: "block text-sm font-medium text-gray-700 mb-2", children: "Image Analysis Model" }), _jsxs("select", { name: "imageAnalysisModel", id: "imageAnalysisModel", value: settings.imageAnalysisModel, onChange: handleInputChange, disabled: !settings.supportedModalities.includes('image'), className: "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500", children: [_jsx("option", { value: "gpt-4-vision", children: "GPT-4 Vision" }), _jsx("option", { value: "claude-3-opus", children: "Claude 3 Opus" }), _jsx("option", { value: "gemini-pro-vision", children: "Gemini Pro Vision" })] })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { htmlFor: "audioTranscriptionModel", className: "block text-sm font-medium text-gray-700 mb-2", children: "Audio Transcription Model" }), _jsxs("select", { name: "audioTranscriptionModel", id: "audioTranscriptionModel", value: settings.audioTranscriptionModel, onChange: handleInputChange, disabled: !settings.supportedModalities.includes('audio'), className: "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500", children: [_jsx("option", { value: "whisper-large-v3", children: "Whisper Large v3" }), _jsx("option", { value: "whisper-medium", children: "Whisper Medium" }), _jsx("option", { value: "whisper-small", children: "Whisper Small" })] })] })] })] })), activeTab === 'advanced' && (_jsxs("div", { className: "bg-white border border-gray-200 rounded-lg shadow-sm mb-4", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: _jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Advanced Settings" }) }), _jsxs("div", { className: "px-6 py-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("label", { htmlFor: "enableDebugMode", className: "text-sm font-medium text-gray-700", children: "Enable Debug Mode" }), _jsx("button", { type: "button", id: "enableDebugMode", onClick: function () { return handleSwitchChange('enableDebugMode', !settings.enableDebugMode); }, className: "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ".concat(settings.enableDebugMode ? 'bg-blue-600' : 'bg-gray-200'), "aria-label": "Enable Debug Mode", children: _jsx("span", { className: "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ".concat(settings.enableDebugMode ? 'translate-x-5' : 'translate-x-0') }) })] }), _jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("label", { htmlFor: "logUserInteractions", className: "text-sm font-medium text-gray-700", children: "Log User Interactions" }), _jsx("button", { type: "button", id: "logUserInteractions", onClick: function () { return handleSwitchChange('logUserInteractions', !settings.logUserInteractions); }, className: "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ".concat(settings.logUserInteractions ? 'bg-blue-600' : 'bg-gray-200'), "aria-label": "Log User Interactions", children: _jsx("span", { className: "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ".concat(settings.logUserInteractions ? 'translate-x-5' : 'translate-x-0') }) })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { htmlFor: "maxConcurrentRequests", className: "block text-sm font-medium text-gray-700 mb-2", children: "Max Concurrent Requests" }), _jsx("input", { type: "number", id: "maxConcurrentRequests", value: settings.maxConcurrentRequests, onChange: function (e) { return handleSliderChange('maxConcurrentRequests', parseInt(e.target.value)); }, min: "1", max: "20", className: "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { htmlFor: "requestTimeout", className: "block text-sm font-medium text-gray-700 mb-2", children: "Request Timeout (seconds)" }), _jsx("input", { type: "number", id: "requestTimeout", value: settings.requestTimeout, onChange: function (e) { return handleSliderChange('requestTimeout', parseInt(e.target.value)); }, min: "5", max: "120", className: "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { htmlFor: "fallbackBehavior", className: "block text-sm font-medium text-gray-700 mb-2", children: "Fallback Behavior" }), _jsxs("select", { name: "fallbackBehavior", id: "fallbackBehavior", value: settings.fallbackBehavior, onChange: handleInputChange, className: "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", children: [_jsx("option", { value: "graceful-degradation", children: "Graceful Degradation" }), _jsx("option", { value: "retry", children: "Retry" }), _jsx("option", { value: "error", children: "Show Error" })] }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "How the system should behave when AI services are unavailable" })] })] })] }))] })] })), !isLoading && (_jsx("div", { className: "mt-6 flex justify-end", children: _jsxs("button", { onClick: handleSaveChanges, disabled: !hasUnsavedChanges || isLoading, className: "bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md flex items-center", children: [_jsx(Save, { className: "w-5 h-5 mr-2" }), isLoading ? 'Saving...' : 'Save Changes'] }) }))] }));
};
