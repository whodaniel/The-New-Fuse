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
import { Button, Input, Select, Checkbox } from '@the-new-fuse/ui-consolidated';
import { Plus, X } from 'lucide-react';
import { useWizard } from '../WizardProvider';
export var AIPreferencesStep = function () {
    var _a, _b;
    var _c = useWizard(), state = _c.state, updateSessionData = _c.updateSessionData;
    var isAIAgent = ((_a = state.session) === null || _a === void 0 ? void 0 : _a.userType) === 'ai_agent';
    // Get existing data from session if available
    var existingData = ((_b = state.session) === null || _b === void 0 ? void 0 : _b.data) || {};
    // Form state
    var _d = useState({
        // Common fields
        preferredModels: existingData.preferredModels || ['gpt-4', 'claude-3-opus'],
        // Human user specific fields
        temperature: existingData.temperature || 0.7,
        maxTokens: existingData.maxTokens || 4000,
        embeddingModel: existingData.embeddingModel || 'text-embedding-3-large',
        // AI agent specific fields
        capabilities: existingData.capabilities || [],
        supportedProtocols: existingData.supportedProtocols || ['http', 'websocket'],
        customCapability: '',
    }), formData = _d[0], setFormData = _d[1];
    // Update session data when form changes
    useEffect(function () {
        updateSessionData(formData);
    }, [formData, updateSessionData]);
    var handleChange = function (e) {
        var _a = e.target, name = _a.name, value = _a.value;
        setFormData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[name] = value, _a)));
        });
    };
    var handleSliderChange = function (name, value) {
        setFormData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[name] = value, _a)));
        });
    };
    var handleCheckboxChange = function (name, values) {
        setFormData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[name] = values, _a)));
        });
    };
    var handleAddCapability = function () {
        if (formData.customCapability.trim()) {
            setFormData(function (prev) { return (__assign(__assign({}, prev), { capabilities: __spreadArray(__spreadArray([], prev.capabilities, true), [prev.customCapability.trim()], false), customCapability: '' })); });
        }
    };
    var handleRemoveCapability = function (capability) {
        setFormData(function (prev) { return (__assign(__assign({}, prev), { capabilities: prev.capabilities.filter(function (cap) { return cap !== capability; }) })); });
    };
    var tagBg = 'bg-blue-100 dark:bg-blue-900';
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold mb-2", children: isAIAgent ? 'Agent Capabilities' : 'AI Preferences' }), _jsx("p", { className: "text-gray-600 dark:text-gray-400 mb-6", children: isAIAgent
                            ? 'Define the capabilities and protocols your agent supports for integration with The New Fuse.'
                            : 'Configure your preferences for AI models and behavior.' })] }), _jsx("div", { className: "space-y-6", children: isAIAgent ? (
                // AI Agent specific fields
                _jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-3", children: "Supported Protocols" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(Checkbox, { label: "HTTP/REST", checked: formData.supportedProtocols.includes('http'), onChange: function (e) {
                                                var values = e.target.checked
                                                    ? __spreadArray(__spreadArray([], formData.supportedProtocols, true), ['http'], false) : formData.supportedProtocols.filter(function (p) { return p !== 'http'; });
                                                handleCheckboxChange('supportedProtocols', values);
                                            } }), _jsx(Checkbox, { label: "WebSocket", checked: formData.supportedProtocols.includes('websocket'), onChange: function (e) {
                                                var values = e.target.checked
                                                    ? __spreadArray(__spreadArray([], formData.supportedProtocols, true), ['websocket'], false) : formData.supportedProtocols.filter(function (p) { return p !== 'websocket'; });
                                                handleCheckboxChange('supportedProtocols', values);
                                            } }), _jsx(Checkbox, { label: "gRPC", checked: formData.supportedProtocols.includes('grpc'), onChange: function (e) {
                                                var values = e.target.checked
                                                    ? __spreadArray(__spreadArray([], formData.supportedProtocols, true), ['grpc'], false) : formData.supportedProtocols.filter(function (p) { return p !== 'grpc'; });
                                                handleCheckboxChange('supportedProtocols', values);
                                            } }), _jsx(Checkbox, { label: "MQTT", checked: formData.supportedProtocols.includes('mqtt'), onChange: function (e) {
                                                var values = e.target.checked
                                                    ? __spreadArray(__spreadArray([], formData.supportedProtocols, true), ['mqtt'], false) : formData.supportedProtocols.filter(function (p) { return p !== 'mqtt'; });
                                                handleCheckboxChange('supportedProtocols', values);
                                            } }), _jsx(Checkbox, { label: "Redis Pub/Sub", checked: formData.supportedProtocols.includes('redis'), onChange: function (e) {
                                                var values = e.target.checked
                                                    ? __spreadArray(__spreadArray([], formData.supportedProtocols, true), ['redis'], false) : formData.supportedProtocols.filter(function (p) { return p !== 'redis'; });
                                                handleCheckboxChange('supportedProtocols', values);
                                            } }), _jsx(Checkbox, { label: "Kafka", checked: formData.supportedProtocols.includes('kafka'), onChange: function (e) {
                                                var values = e.target.checked
                                                    ? __spreadArray(__spreadArray([], formData.supportedProtocols, true), ['kafka'], false) : formData.supportedProtocols.filter(function (p) { return p !== 'kafka'; });
                                                handleCheckboxChange('supportedProtocols', values);
                                            } })] })] }), _jsx("hr", { className: "border-gray-200 dark:border-gray-700" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-3", children: "Agent Capabilities" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-3", children: "Select the capabilities your agent provides:" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-4", children: [_jsx(Checkbox, { label: "Text Generation", checked: formData.capabilities.includes('text-generation'), onChange: function (e) {
                                                var values = e.target.checked
                                                    ? __spreadArray(__spreadArray([], formData.capabilities, true), ['text-generation'], false) : formData.capabilities.filter(function (c) { return c !== 'text-generation'; });
                                                handleCheckboxChange('capabilities', values);
                                            } }), _jsx(Checkbox, { label: "Code Generation", checked: formData.capabilities.includes('code-generation'), onChange: function (e) {
                                                var values = e.target.checked
                                                    ? __spreadArray(__spreadArray([], formData.capabilities, true), ['code-generation'], false) : formData.capabilities.filter(function (c) { return c !== 'code-generation'; });
                                                handleCheckboxChange('capabilities', values);
                                            } }), _jsx(Checkbox, { label: "Text Embedding", checked: formData.capabilities.includes('text-embedding'), onChange: function (e) {
                                                var values = e.target.checked
                                                    ? __spreadArray(__spreadArray([], formData.capabilities, true), ['text-embedding'], false) : formData.capabilities.filter(function (c) { return c !== 'text-embedding'; });
                                                handleCheckboxChange('capabilities', values);
                                            } }), _jsx(Checkbox, { label: "Image Generation", checked: formData.capabilities.includes('image-generation'), onChange: function (e) {
                                                var values = e.target.checked
                                                    ? __spreadArray(__spreadArray([], formData.capabilities, true), ['image-generation'], false) : formData.capabilities.filter(function (c) { return c !== 'image-generation'; });
                                                handleCheckboxChange('capabilities', values);
                                            } }), _jsx(Checkbox, { label: "Text Classification", checked: formData.capabilities.includes('text-classification'), onChange: function (e) {
                                                var values = e.target.checked
                                                    ? __spreadArray(__spreadArray([], formData.capabilities, true), ['text-classification'], false) : formData.capabilities.filter(function (c) { return c !== 'text-classification'; });
                                                handleCheckboxChange('capabilities', values);
                                            } }), _jsx(Checkbox, { label: "Summarization", checked: formData.capabilities.includes('summarization'), onChange: function (e) {
                                                var values = e.target.checked
                                                    ? __spreadArray(__spreadArray([], formData.capabilities, true), ['summarization'], false) : formData.capabilities.filter(function (c) { return c !== 'summarization'; });
                                                handleCheckboxChange('capabilities', values);
                                            } }), _jsx(Checkbox, { label: "Translation", checked: formData.capabilities.includes('translation'), onChange: function (e) {
                                                var values = e.target.checked
                                                    ? __spreadArray(__spreadArray([], formData.capabilities, true), ['translation'], false) : formData.capabilities.filter(function (c) { return c !== 'translation'; });
                                                handleCheckboxChange('capabilities', values);
                                            } }), _jsx(Checkbox, { label: "Question Answering", checked: formData.capabilities.includes('question-answering'), onChange: function (e) {
                                                var values = e.target.checked
                                                    ? __spreadArray(__spreadArray([], formData.capabilities, true), ['question-answering'], false) : formData.capabilities.filter(function (c) { return c !== 'question-answering'; });
                                                handleCheckboxChange('capabilities', values);
                                            } }), _jsx(Checkbox, { label: "Data Analysis", checked: formData.capabilities.includes('data-analysis'), onChange: function (e) {
                                                var values = e.target.checked
                                                    ? __spreadArray(__spreadArray([], formData.capabilities, true), ['data-analysis'], false) : formData.capabilities.filter(function (c) { return c !== 'data-analysis'; });
                                                handleCheckboxChange('capabilities', values);
                                            } }), _jsx(Checkbox, { label: "Search", checked: formData.capabilities.includes('search'), onChange: function (e) {
                                                var values = e.target.checked
                                                    ? __spreadArray(__spreadArray([], formData.capabilities, true), ['search'], false) : formData.capabilities.filter(function (c) { return c !== 'search'; });
                                                handleCheckboxChange('capabilities', values);
                                            } })] }), _jsxs("div", { className: "mt-4", children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Custom Capabilities" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { placeholder: "Add custom capability...", value: formData.customCapability, name: "customCapability", onChange: handleChange, className: "flex-1" }), _jsxs(Button, { onClick: handleAddCapability, disabled: !formData.customCapability.trim(), className: "flex items-center gap-2", children: [_jsx(Plus, { className: "w-3 h-3" }), "Add"] })] }), _jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: formData.capabilities.filter(function (cap) {
                                                return !['text-generation', 'code-generation', 'text-embedding', 'image-generation',
                                                    'text-classification', 'summarization', 'translation', 'question-answering',
                                                    'data-analysis', 'search'].includes(cap);
                                            }).map(function (capability) { return (_jsxs("span", { className: "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ".concat(tagBg, " text-black"), children: [capability, _jsx("button", { onClick: function () { return handleRemoveCapability(capability); }, className: "ml-1 hover:bg-black/10 rounded-full p-0.5", title: "Remove ".concat(capability, " capability"), "aria-label": "Remove ".concat(capability, " capability"), children: _jsx(X, { className: "w-3 h-3" }) })] }, capability)); }) })] })] })] })) : (
                // Human user specific fields
                _jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-3", children: "Preferred AI Models" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(Checkbox, { label: "GPT-4", checked: formData.preferredModels.includes('gpt-4'), onChange: function (e) {
                                                var values = e.target.checked
                                                    ? __spreadArray(__spreadArray([], formData.preferredModels, true), ['gpt-4'], false) : formData.preferredModels.filter(function (m) { return m !== 'gpt-4'; });
                                                handleCheckboxChange('preferredModels', values);
                                            } }), _jsx(Checkbox, { label: "GPT-3.5 Turbo", checked: formData.preferredModels.includes('gpt-3.5-turbo'), onChange: function (e) {
                                                var values = e.target.checked
                                                    ? __spreadArray(__spreadArray([], formData.preferredModels, true), ['gpt-3.5-turbo'], false) : formData.preferredModels.filter(function (m) { return m !== 'gpt-3.5-turbo'; });
                                                handleCheckboxChange('preferredModels', values);
                                            } }), _jsx(Checkbox, { label: "Claude 3 Opus", checked: formData.preferredModels.includes('claude-3-opus'), onChange: function (e) {
                                                var values = e.target.checked
                                                    ? __spreadArray(__spreadArray([], formData.preferredModels, true), ['claude-3-opus'], false) : formData.preferredModels.filter(function (m) { return m !== 'claude-3-opus'; });
                                                handleCheckboxChange('preferredModels', values);
                                            } }), _jsx(Checkbox, { label: "Claude 3 Sonnet", checked: formData.preferredModels.includes('claude-3-sonnet'), onChange: function (e) {
                                                var values = e.target.checked
                                                    ? __spreadArray(__spreadArray([], formData.preferredModels, true), ['claude-3-sonnet'], false) : formData.preferredModels.filter(function (m) { return m !== 'claude-3-sonnet'; });
                                                handleCheckboxChange('preferredModels', values);
                                            } }), _jsx(Checkbox, { label: "Llama 3", checked: formData.preferredModels.includes('llama-3'), onChange: function (e) {
                                                var values = e.target.checked
                                                    ? __spreadArray(__spreadArray([], formData.preferredModels, true), ['llama-3'], false) : formData.preferredModels.filter(function (m) { return m !== 'llama-3'; });
                                                handleCheckboxChange('preferredModels', values);
                                            } }), _jsx(Checkbox, { label: "Mistral Large", checked: formData.preferredModels.includes('mistral-large'), onChange: function (e) {
                                                var values = e.target.checked
                                                    ? __spreadArray(__spreadArray([], formData.preferredModels, true), ['mistral-large'], false) : formData.preferredModels.filter(function (m) { return m !== 'mistral-large'; });
                                                handleCheckboxChange('preferredModels', values);
                                            } })] })] }), _jsx("hr", { className: "border-gray-200 dark:border-gray-700" }), _jsx("div", { children: _jsx(Select, { label: "Embedding Model", name: "embeddingModel", value: formData.embeddingModel, onChange: handleChange, options: [
                                    { value: 'text-embedding-3-large', label: 'OpenAI text-embedding-3-large' },
                                    { value: 'text-embedding-3-small', label: 'OpenAI text-embedding-3-small' },
                                    { value: 'claude-3-embedding', label: 'Claude 3 Embedding' },
                                    { value: 'voyage-embedding', label: 'Voyage Embedding' },
                                    { value: 'cohere-embed', label: 'Cohere Embed' }
                                ] }) }), _jsx("hr", { className: "border-gray-200 dark:border-gray-700" }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "temperature-slider", className: "block text-sm font-medium mb-2", children: ["Temperature: ", formData.temperature] }), _jsx("input", { id: "temperature-slider", type: "range", min: 0, max: 1, step: 0.1, value: formData.temperature, onChange: function (e) { return handleSliderChange('temperature', parseFloat(e.target.value)); }, className: "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700", title: "Temperature slider", "aria-label": "Temperature slider" }), _jsxs("div", { className: "flex justify-between mt-1", children: [_jsx("span", { className: "text-xs text-gray-500", children: "More Deterministic" }), _jsx("span", { className: "text-xs text-gray-500", children: "More Creative" })] })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "max-tokens-slider", className: "block text-sm font-medium mb-2", children: ["Max Tokens: ", formData.maxTokens] }), _jsx("input", { id: "max-tokens-slider", type: "range", min: 1000, max: 8000, step: 1000, value: formData.maxTokens, onChange: function (e) { return handleSliderChange('maxTokens', parseInt(e.target.value)); }, className: "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700", title: "Max tokens slider", "aria-label": "Max tokens slider" }), _jsxs("div", { className: "flex justify-between mt-1", children: [_jsx("span", { className: "text-xs text-gray-500", children: "Shorter" }), _jsx("span", { className: "text-xs text-gray-500", children: "Longer" })] })] })] })) })] }));
};
