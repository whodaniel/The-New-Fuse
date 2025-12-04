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
import { useState } from 'react';
import { Check, Info, Cpu, User, Cog, BarChart, Pencil, Code } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
var CreateAgent = function () {
    var navigate = useNavigate();
    var _a = useState(1), currentStep = _a[0], setCurrentStep = _a[1];
    var _b = useState(false), saving = _b[0], setSaving = _b[1];
    var _c = useState({
        name: '',
        description: '',
        type: 'conversational',
        model: 'gpt-4',
        deployment: 'cloud',
        capabilities: [],
        systemPrompt: '',
        temperature: 0.7,
        maxTokens: 2048,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        tags: [],
        isPublic: false,
        enableLogging: true,
        enableMetrics: true,
        rateLimitPerMinute: 60,
        timeoutSeconds: 30
    }), config = _c[0], setConfig = _c[1];
    var steps = [
        { id: 1, name: 'Basic Info', icon: Info },
        { id: 2, name: 'Configuration', icon: Cog },
        { id: 3, name: 'Capabilities', icon: Cpu },
        { id: 4, name: 'Advanced', icon: Code },
        { id: 5, name: 'Review', icon: Check }
    ];
    var agentTypes = [
        {
            id: 'conversational',
            name: 'Conversational',
            description: 'Chat-based agents for customer support, Q&A, and general conversation',
            icon: User,
            color: 'blue'
        },
        {
            id: 'task-automation',
            name: 'Task Automation',
            description: 'Agents that automate workflows, processes, and repetitive tasks',
            icon: Cog,
            color: 'green'
        },
        {
            id: 'data-analysis',
            name: 'Data Analysis',
            description: 'Agents specialized in analyzing data, generating reports, and insights',
            icon: BarChart,
            color: 'purple'
        },
        {
            id: 'content-generation',
            name: 'Content Generation',
            description: 'Agents for creating content, writing, and creative tasks',
            icon: Pencil,
            color: 'orange'
        }
    ];
    var availableModels = [
        { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', description: 'Most capable model' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', description: 'Fast and efficient' },
        { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', description: 'Excellent reasoning' },
        { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', description: 'Balanced performance' },
        { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google', description: 'Multimodal capabilities' }
    ];
    var availableCapabilities = [
        'Text Generation',
        'Code Generation',
        'Data Analysis',
        'Web Search',
        'File Processing',
        'Image Analysis',
        'API Integration',
        'Database Queries',
        'Email Sending',
        'Scheduling',
        'Translation',
        'Summarization'
    ];
    var handleCapabilityToggle = function (capability) {
        setConfig(function (prev) { return (__assign(__assign({}, prev), { capabilities: prev.capabilities.includes(capability)
                ? prev.capabilities.filter(function (c) { return c !== capability; })
                : __spreadArray(__spreadArray([], prev.capabilities, true), [capability], false) })); });
    };
    var handleTagAdd = function (tag) {
        if (tag && !config.tags.includes(tag)) {
            setConfig(function (prev) { return (__assign(__assign({}, prev), { tags: __spreadArray(__spreadArray([], prev.tags, true), [tag], false) })); });
        }
    };
    var handleTagRemove = function (tag) {
        setConfig(function (prev) { return (__assign(__assign({}, prev), { tags: prev.tags.filter(function (t) { return t !== tag; }) })); });
    };
    var handleSave = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, agent, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setSaving(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 7]);
                    return [4 /*yield*/, fetch('/api/dashboard/agents', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(config)
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    agent = _a.sent();
                    navigate("/dashboard/agents/".concat(agent.id));
                    _a.label = 4;
                case 4: return [3 /*break*/, 7];
                case 5:
                    error_1 = _a.sent();
                    console.error('Failed to create agent:', error_1);
                    return [3 /*break*/, 7];
                case 6:
                    setSaving(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var renderStepContent = function () {
        switch (currentStep) {
            case 1:
                return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "agentName", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Agent Name *" }), _jsx("input", { type: "text", id: "agentName", value: config.name, onChange: function (e) { return setConfig(__assign(__assign({}, config), { name: e.target.value })); }, placeholder: "Enter a descriptive name for your agent", className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white", required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "agentDescription", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Description *" }), _jsx("textarea", { id: "agentDescription", value: config.description, onChange: function (e) { return setConfig(__assign(__assign({}, config), { description: e.target.value })); }, placeholder: "Describe what this agent does and its purpose", rows: 3, className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4", children: "Agent Type *" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: agentTypes.map(function (type) { return (_jsx("div", { className: "relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ".concat(config.type === type.id
                                            ? "border-".concat(type.color, "-500 bg-").concat(type.color, "-50 dark:bg-").concat(type.color, "-900/20")
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'), onClick: function () { return setConfig(__assign(__assign({}, config), { type: type.id })); }, children: _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("div", { className: "p-2 bg-".concat(type.color, "-100 dark:bg-").concat(type.color, "-900 rounded-lg"), children: _jsx(type.icon, { className: "w-6 h-6 text-".concat(type.color, "-600") }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-white", children: type.name }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-300 mt-1", children: type.description })] }), config.type === type.id && (_jsx(Check, { className: "w-5 h-5 text-".concat(type.color, "-600") }))] }) }, type.id)); }) })] })] }));
            case 2:
                return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4", children: "Language Model *" }), _jsx("div", { className: "space-y-3", children: availableModels.map(function (model) { return (_jsx("div", { className: "p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ".concat(config.model === model.id
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'), onClick: function () { return setConfig(__assign(__assign({}, config), { model: model.id })); }, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-white", children: model.name }), _jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-300", children: [model.provider, " \u2022 ", model.description] })] }), config.model === model.id && (_jsx(CheckIcon, { className: "w-5 h-5 text-blue-600" }))] }) }, model.id)); }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4", children: "Deployment Type *" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsx("div", { className: "p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ".concat(config.deployment === 'cloud'
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'), onClick: function () { return setConfig(__assign(__assign({}, config), { deployment: 'cloud' })); }, children: _jsxs("div", { className: "text-center", children: [_jsx(CloudIcon, { className: "w-8 h-8 mx-auto mb-2 text-blue-600" }), _jsx("h3", { className: "font-medium text-gray-900 dark:text-white", children: "Cloud" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-300 mt-1", children: "Hosted and managed" })] }) }), _jsx("div", { className: "p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ".concat(config.deployment === 'local'
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'), onClick: function () { return setConfig(__assign(__assign({}, config), { deployment: 'local' })); }, children: _jsxs("div", { className: "text-center", children: [_jsx(CpuChipIcon, { className: "w-8 h-8 mx-auto mb-2 text-green-600" }), _jsx("h3", { className: "font-medium text-gray-900 dark:text-white", children: "Local" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-300 mt-1", children: "Self-hosted" })] }) }), _jsx("div", { className: "p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ".concat(config.deployment === 'hybrid'
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'), onClick: function () { return setConfig(__assign(__assign({}, config), { deployment: 'hybrid' })); }, children: _jsxs("div", { className: "text-center", children: [_jsx(GlobeAltIcon, { className: "w-8 h-8 mx-auto mb-2 text-purple-600" }), _jsx("h3", { className: "font-medium text-gray-900 dark:text-white", children: "Hybrid" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-300 mt-1", children: "Mixed deployment" })] }) })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "systemPrompt", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "System Prompt" }), _jsx("textarea", { id: "systemPrompt", value: config.systemPrompt, onChange: function (e) { return setConfig(__assign(__assign({}, config), { systemPrompt: e.target.value })); }, placeholder: "Define the agent's behavior, personality, and instructions...", rows: 4, className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" })] })] }));
            case 3:
                return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4", children: "Agent Capabilities" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-4", children: "Select the capabilities your agent should have access to." }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3", children: availableCapabilities.map(function (capability) { return (_jsxs("label", { className: "flex items-center space-x-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: config.capabilities.includes(capability), onChange: function () { return handleCapabilityToggle(capability); }, className: "rounded border-gray-300 text-blue-600 focus:ring-blue-500" }), _jsx("span", { className: "text-sm text-gray-700 dark:text-gray-300", children: capability })] }, capability)); }) })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "tags", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Tags" }), _jsx("div", { className: "flex flex-wrap gap-2 mb-2", children: config.tags.map(function (tag) { return (_jsxs("span", { className: "inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full", children: [tag, _jsx("button", { onClick: function () { return handleTagRemove(tag); }, className: "ml-2 text-blue-600 hover:text-blue-800", title: "Remove tag", children: _jsx(XMarkIcon, { className: "w-4 h-4" }) })] }, tag)); }) }), _jsx("input", { type: "text", id: "tags", placeholder: "Add tags (press Enter)", onKeyPress: function (e) {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleTagAdd(e.currentTarget.value);
                                            e.currentTarget.value = '';
                                        }
                                    }, className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" })] })] }));
            case 4:
                return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsxs("label", { htmlFor: "temperature", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: ["Temperature: ", config.temperature] }), _jsx("input", { type: "range", id: "temperature", min: "0", max: "2", step: "0.1", value: config.temperature, onChange: function (e) { return setConfig(__assign(__assign({}, config), { temperature: parseFloat(e.target.value) })); }, className: "w-full" }), _jsxs("div", { className: "flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1", children: [_jsx("span", { children: "Focused" }), _jsx("span", { children: "Creative" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "maxTokens", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Max Tokens" }), _jsx("input", { type: "number", id: "maxTokens", min: "1", max: "8192", value: config.maxTokens, onChange: function (e) { return setConfig(__assign(__assign({}, config), { maxTokens: parseInt(e.target.value) })); }, className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "topP", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: ["Top P: ", config.topP] }), _jsx("input", { type: "range", id: "topP", min: "0", max: "1", step: "0.1", value: config.topP, onChange: function (e) { return setConfig(__assign(__assign({}, config), { topP: parseFloat(e.target.value) })); }, className: "w-full" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "rateLimitPerMinute", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Rate Limit (per minute)" }), _jsx("input", { type: "number", id: "rateLimitPerMinute", min: "1", max: "1000", value: config.rateLimitPerMinute, onChange: function (e) { return setConfig(__assign(__assign({}, config), { rateLimitPerMinute: parseInt(e.target.value) })); }, className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: config.isPublic, onChange: function (e) { return setConfig(__assign(__assign({}, config), { isPublic: e.target.checked })); }, className: "rounded border-gray-300 text-blue-600 focus:ring-blue-500" }), _jsx("span", { className: "text-sm text-gray-700 dark:text-gray-300", children: "Make this agent publicly available" })] }), _jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: config.enableLogging, onChange: function (e) { return setConfig(__assign(__assign({}, config), { enableLogging: e.target.checked })); }, className: "rounded border-gray-300 text-blue-600 focus:ring-blue-500" }), _jsx("span", { className: "text-sm text-gray-700 dark:text-gray-300", children: "Enable conversation logging" })] }), _jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: config.enableMetrics, onChange: function (e) { return setConfig(__assign(__assign({}, config), { enableMetrics: e.target.checked })); }, className: "rounded border-gray-300 text-blue-600 focus:ring-blue-500" }), _jsx("span", { className: "text-sm text-gray-700 dark:text-gray-300", children: "Enable performance metrics" })] })] })] }));
            case 5:
                return (_jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "bg-gray-50 dark:bg-gray-800 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: "Agent Summary" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 dark:text-white mb-2", children: "Basic Information" }), _jsxs("dl", { className: "space-y-2 text-sm", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-gray-500 dark:text-gray-400", children: "Name:" }), _jsx("dd", { className: "text-gray-900 dark:text-white", children: config.name })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-gray-500 dark:text-gray-400", children: "Type:" }), _jsx("dd", { className: "text-gray-900 dark:text-white capitalize", children: config.type.replace('-', ' ') })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-gray-500 dark:text-gray-400", children: "Model:" }), _jsx("dd", { className: "text-gray-900 dark:text-white", children: config.model })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-gray-500 dark:text-gray-400", children: "Deployment:" }), _jsx("dd", { className: "text-gray-900 dark:text-white capitalize", children: config.deployment })] })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 dark:text-white mb-2", children: "Configuration" }), _jsxs("dl", { className: "space-y-2 text-sm", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-gray-500 dark:text-gray-400", children: "Temperature:" }), _jsx("dd", { className: "text-gray-900 dark:text-white", children: config.temperature })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-gray-500 dark:text-gray-400", children: "Max Tokens:" }), _jsx("dd", { className: "text-gray-900 dark:text-white", children: config.maxTokens })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-gray-500 dark:text-gray-400", children: "Rate Limit:" }), _jsxs("dd", { className: "text-gray-900 dark:text-white", children: [config.rateLimitPerMinute, "/min"] })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-gray-500 dark:text-gray-400", children: "Public:" }), _jsx("dd", { className: "text-gray-900 dark:text-white", children: config.isPublic ? 'Yes' : 'No' })] })] })] })] }), config.capabilities.length > 0 && (_jsxs("div", { className: "mt-4", children: [_jsx("h4", { className: "font-medium text-gray-900 dark:text-gray-900 mb-2", children: "Capabilities" }), _jsx("div", { className: "flex flex-wrap gap-2", children: config.capabilities.map(function (capability) { return (_jsx("span", { className: "px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full", children: capability }, capability)); }) })] })), config.tags.length > 0 && (_jsxs("div", { className: "mt-4", children: [_jsx("h4", { className: "font-medium text-gray-900 dark:text-gray-900 mb-2", children: "Tags" }), _jsx("div", { className: "flex flex-wrap gap-2", children: config.tags.map(function (tag) { return (_jsx("span", { className: "px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-full", children: tag }, tag)); }) })] }))] }) }));
            default:
                return null;
        }
    };
    var isStepValid = function () {
        switch (currentStep) {
            case 1:
                return config.name.trim() && config.description.trim() && config.type;
            case 2:
                return config.model && config.deployment;
            case 3:
            case 4:
            case 5:
                return true;
            default:
                return false;
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsxs("div", { className: "mb-8", children: [_jsxs("div", { className: "flex items-center space-x-4 mb-4", children: [_jsx(Link, { to: "/dashboard/agents", className: "p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors", children: _jsx(ArrowLeftIcon, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: "Create New Agent" }), _jsxs("p", { className: "text-gray-600 dark:text-gray-300", children: ["Step ", currentStep, " of ", steps.length] })] })] }), _jsx("div", { className: "flex items-center space-x-4", children: steps.map(function (step, index) { return (_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ".concat(currentStep > step.id
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : currentStep === step.id
                                                ? 'bg-blue-500 border-blue-500 text-white'
                                                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500'), children: currentStep > step.id ? (_jsx(CheckIcon, { className: "w-5 h-5" })) : (_jsx(step.icon, { className: "w-5 h-5" })) }), _jsx("span", { className: "ml-2 text-sm font-medium ".concat(currentStep >= step.id
                                            ? 'text-gray-900 dark:text-white'
                                            : 'text-gray-500 dark:text-gray-400'), children: step.name }), index < steps.length - 1 && (_jsx("div", { className: "w-8 h-px bg-gray-300 dark:bg-gray-600 mx-4" }))] }, step.id)); }) })] }), _jsx("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 mb-8", children: renderStepContent() }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("button", { onClick: function () { return setCurrentStep(Math.max(1, currentStep - 1)); }, disabled: currentStep === 1, className: "px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: "Previous" }), _jsx("div", { className: "flex space-x-3", children: currentStep < steps.length ? (_jsx("button", { onClick: function () { return setCurrentStep(currentStep + 1); }, disabled: !isStepValid(), className: "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: "Next" })) : (_jsx("button", { onClick: handleSave, disabled: saving, className: "px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center", children: saving ? (_jsxs(_Fragment, { children: [_jsx(Loader, { className: "animate-spin -ml-1 mr-3 h-5 w-5 text-white" }), "Saving..."] })) : ('Save Agent') })) })] })] }) }));
};
export default CreateAgent;
