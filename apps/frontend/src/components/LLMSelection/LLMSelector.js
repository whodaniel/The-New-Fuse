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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { PlusCircle, CheckCircle, Trash2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from '@/components/ui/toast';
export var LLMSelector = function (_a) {
    var selectedProviderId = _a.selectedProviderId, onChange = _a.onChange, _b = _a.label, label = _b === void 0 ? 'LLM Provider' : _b, description = _a.description, _c = _a.disabled, disabled = _c === void 0 ? false : _c;
    var _d = useState([]), providers = _d[0], setProviders = _d[1];
    var _e = useState(true), loading = _e[0], setLoading = _e[1];
    var _f = useState({
        name: '',
        provider: 'openai',
        apiKey: '',
        apiEndpoint: '',
        modelName: ''
    }), customProviderForm = _f[0], setCustomProviderForm = _f[1];
    var _g = useState(false), addDialogOpen = _g[0], setAddDialogOpen = _g[1];
    useEffect(function () {
        fetchProviders();
    }, []);
    var fetchProviders = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, defaultProvider, error_1, demoProviders;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, apiService.get('/api/llm/providers')];
                case 2:
                    response = _a.sent();
                    setProviders(response.data);
                    // If no provider is selected, select the default one
                    if (!selectedProviderId && response.data.length > 0) {
                        defaultProvider = response.data.find(function (p) { return p.isDefault; }) || response.data[0];
                        onChange(defaultProvider.id);
                    }
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error('Failed to fetch LLM providers:', error_1);
                    demoProviders = [
                        { id: 'openai-gpt4', name: 'GPT-4', provider: 'openai', modelName: 'gpt-4', isDefault: true },
                        { id: 'openai-gpt35', name: 'GPT-3.5 Turbo', provider: 'openai', modelName: 'gpt-3.5-turbo' },
                        { id: 'anthropic-claude3', name: 'Claude 3 Opus', provider: 'anthropic', modelName: 'claude-3-opus-20240229' },
                        { id: 'anthropic-claude3-sonnet', name: 'Claude 3 Sonnet', provider: 'anthropic', modelName: 'claude-3-sonnet-20240229' }
                    ];
                    setProviders(demoProviders);
                    if (!selectedProviderId && demoProviders.length > 0) {
                        onChange(demoProviders[0].id);
                    }
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleAddCustomProvider = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, newProvider, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    // Validate form
                    if (!customProviderForm.name || !customProviderForm.apiKey || !customProviderForm.modelName) {
                        toast.error('Please fill all required fields.');
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, apiService.post('/api/llm/providers', customProviderForm)];
                case 1:
                    response = _a.sent();
                    newProvider = {
                        id: "custom-".concat(Date.now()),
                        name: customProviderForm.name,
                        provider: customProviderForm.provider,
                        modelName: customProviderForm.modelName,
                        isCustom: true
                    };
                    setProviders(__spreadArray(__spreadArray([], providers, true), [newProvider], false));
                    onChange(newProvider.id);
                    setAddDialogOpen(false);
                    // Reset form
                    setCustomProviderForm({
                        name: '',
                        provider: 'openai',
                        apiKey: '',
                        apiEndpoint: '',
                        modelName: ''
                    });
                    toast.success('Custom provider added successfully!');
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    console.error('Failed to add custom provider:', error_2);
                    toast.error('Failed to add custom provider. Please try again.');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var handleDeleteProvider = function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var updatedProviders, defaultProvider, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    // In a real implementation, this would call an API endpoint
                    return [4 /*yield*/, apiService.delete("/api/llm/providers/".concat(id))];
                case 1:
                    // In a real implementation, this would call an API endpoint
                    _a.sent();
                    updatedProviders = providers.filter(function (p) { return p.id !== id; });
                    setProviders(updatedProviders);
                    // If the deleted provider was selected, select the default or first one
                    if (selectedProviderId === id && updatedProviders.length > 0) {
                        defaultProvider = updatedProviders.find(function (p) { return p.isDefault; }) || updatedProviders[0];
                        onChange(defaultProvider.id);
                    }
                    toast.success('Provider deleted successfully!');
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.error('Failed to delete provider:', error_3);
                    toast.error('Failed to delete provider. Please try again.');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var selectedProvider = providers.find(function (p) { return p.id === selectedProviderId; });
    return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [label && _jsx(Label, { className: "text-sm font-medium", children: label }), _jsxs(Dialog, { open: addDialogOpen, onOpenChange: setAddDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", size: "sm", className: "h-8 px-2 text-xs", disabled: disabled, children: [_jsx(PlusCircle, { className: "mr-1 h-3.5 w-3.5" }), "Add Custom"] }) }), _jsxs(DialogContent, { className: "sm:max-w-[425px]", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Add Custom LLM Provider" }) }), _jsxs(Tabs, { defaultValue: "openai", className: "w-full", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-3", children: [_jsx(TabsTrigger, { value: "openai", children: "OpenAI" }), _jsx(TabsTrigger, { value: "anthropic", children: "Anthropic" }), _jsx(TabsTrigger, { value: "other", children: "Other" })] }), _jsx(TabsContent, { value: "openai", className: "space-y-4 mt-4", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid w-full gap-2", children: [_jsx(Label, { htmlFor: "name", children: "Display Name *" }), _jsx(Input, { id: "name", value: customProviderForm.name, onChange: function (e) { return setCustomProviderForm(__assign(__assign({}, customProviderForm), { name: e.target.value })); }, placeholder: "e.g. My OpenAI GPT-4" })] }), _jsxs("div", { className: "grid w-full gap-2", children: [_jsx(Label, { htmlFor: "apiKey", children: "API Key *" }), _jsx(Input, { id: "apiKey", type: "password", value: customProviderForm.apiKey, onChange: function (e) { return setCustomProviderForm(__assign(__assign({}, customProviderForm), { apiKey: e.target.value })); }, placeholder: "sk-..." })] }), _jsxs("div", { className: "grid w-full gap-2", children: [_jsx(Label, { htmlFor: "modelName", children: "Model *" }), _jsxs(Select, { value: customProviderForm.modelName, onValueChange: function (value) { return setCustomProviderForm(__assign(__assign({}, customProviderForm), { modelName: value })); }, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select model" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "gpt-4", children: "GPT-4" }), _jsx(SelectItem, { value: "gpt-4-turbo", children: "GPT-4 Turbo" }), _jsx(SelectItem, { value: "gpt-3.5-turbo", children: "GPT-3.5 Turbo" }), _jsx(SelectItem, { value: "gpt-4o", children: "GPT-4o" })] })] })] }), _jsxs("div", { className: "grid w-full gap-2", children: [_jsx(Label, { htmlFor: "apiEndpoint", children: "API Endpoint (optional)" }), _jsx(Input, { id: "apiEndpoint", value: customProviderForm.apiEndpoint, onChange: function (e) { return setCustomProviderForm(__assign(__assign({}, customProviderForm), { apiEndpoint: e.target.value })); }, placeholder: "https://api.openai.com/v1" })] })] }) }), _jsx(TabsContent, { value: "anthropic", className: "space-y-4 mt-4", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid w-full gap-2", children: [_jsx(Label, { htmlFor: "name", children: "Display Name *" }), _jsx(Input, { id: "name", value: customProviderForm.name, onChange: function (e) { return setCustomProviderForm(__assign(__assign({}, customProviderForm), { name: e.target.value, provider: 'anthropic' })); }, placeholder: "e.g. My Claude 3" })] }), _jsxs("div", { className: "grid w-full gap-2", children: [_jsx(Label, { htmlFor: "apiKey", children: "API Key *" }), _jsx(Input, { id: "apiKey", type: "password", value: customProviderForm.apiKey, onChange: function (e) { return setCustomProviderForm(__assign(__assign({}, customProviderForm), { apiKey: e.target.value })); }, placeholder: "sk-ant-..." })] }), _jsxs("div", { className: "grid w-full gap-2", children: [_jsx(Label, { htmlFor: "modelName", children: "Model *" }), _jsxs(Select, { value: customProviderForm.modelName, onValueChange: function (value) { return setCustomProviderForm(__assign(__assign({}, customProviderForm), { modelName: value })); }, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select model" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "claude-3-opus-20240229", children: "Claude 3 Opus" }), _jsx(SelectItem, { value: "claude-3-sonnet-20240229", children: "Claude 3 Sonnet" }), _jsx(SelectItem, { value: "claude-3-haiku-20240307", children: "Claude 3 Haiku" })] })] })] })] }) }), _jsx(TabsContent, { value: "other", className: "space-y-4 mt-4", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid w-full gap-2", children: [_jsx(Label, { htmlFor: "name", children: "Display Name *" }), _jsx(Input, { id: "name", value: customProviderForm.name, onChange: function (e) { return setCustomProviderForm(__assign(__assign({}, customProviderForm), { name: e.target.value })); }, placeholder: "e.g. My Custom LLM" })] }), _jsxs("div", { className: "grid w-full gap-2", children: [_jsx(Label, { htmlFor: "provider", children: "Provider *" }), _jsx(Input, { id: "provider", value: customProviderForm.provider, onChange: function (e) { return setCustomProviderForm(__assign(__assign({}, customProviderForm), { provider: e.target.value })); }, placeholder: "e.g. mistral, ollama, aws" })] }), _jsxs("div", { className: "grid w-full gap-2", children: [_jsx(Label, { htmlFor: "apiKey", children: "API Key *" }), _jsx(Input, { id: "apiKey", type: "password", value: customProviderForm.apiKey, onChange: function (e) { return setCustomProviderForm(__assign(__assign({}, customProviderForm), { apiKey: e.target.value })); }, placeholder: "Enter your API key" })] }), _jsxs("div", { className: "grid w-full gap-2", children: [_jsx(Label, { htmlFor: "modelName", children: "Model Name *" }), _jsx(Input, { id: "modelName", value: customProviderForm.modelName, onChange: function (e) { return setCustomProviderForm(__assign(__assign({}, customProviderForm), { modelName: e.target.value })); }, placeholder: "e.g. mistral-7b-instruct" })] }), _jsxs("div", { className: "grid w-full gap-2", children: [_jsx(Label, { htmlFor: "apiEndpoint", children: "API Endpoint *" }), _jsx(Input, { id: "apiEndpoint", value: customProviderForm.apiEndpoint, onChange: function (e) { return setCustomProviderForm(__assign(__assign({}, customProviderForm), { apiEndpoint: e.target.value })); }, placeholder: "https://api.example.com/v1" })] })] }) })] }), _jsxs(DialogFooter, { className: "mt-4", children: [_jsx(DialogClose, { asChild: true, children: _jsx(Button, { variant: "outline", children: "Cancel" }) }), _jsx(Button, { onClick: handleAddCustomProvider, children: "Add Provider" })] })] })] })] }), _jsxs(Select, { value: selectedProviderId, onValueChange: onChange, disabled: disabled || loading, children: [_jsx(SelectTrigger, { className: "w-full", children: _jsx(SelectValue, { placeholder: "Select an LLM provider" }) }), _jsx(SelectContent, { children: providers.length === 0 && loading ? (_jsx("div", { className: "p-2 text-center text-sm text-gray-500", children: "Loading providers..." })) : providers.length === 0 ? (_jsx("div", { className: "p-2 text-center text-sm text-gray-500", children: "No providers available" })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "p-2 text-xs font-medium text-gray-500", children: "Default Providers" }), providers.filter(function (p) { return !p.isCustom; }).map(function (provider) { return (_jsx(SelectItem, { value: provider.id, children: _jsxs("div", { className: "flex items-center", children: [_jsx("span", { children: provider.name }), provider.isDefault && (_jsx(CheckCircle, { className: "ml-2 h-3.5 w-3.5 text-green-500" }))] }) }, provider.id)); }), providers.some(function (p) { return p.isCustom; }) && (_jsxs(_Fragment, { children: [_jsx("div", { className: "mt-2 p-2 text-xs font-medium text-gray-500", children: "Custom Providers" }), providers.filter(function (p) { return p.isCustom; }).map(function (provider) { return (_jsx(SelectItem, { value: provider.id, children: _jsxs("div", { className: "flex items-center justify-between w-full", children: [_jsx("span", { children: provider.name }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-6 w-6 p-0 text-red-500", onClick: function (e) {
                                                            e.stopPropagation();
                                                            handleDeleteProvider(provider.id);
                                                        }, children: _jsx(Trash2, { className: "h-3.5 w-3.5" }) })] }) }, provider.id)); })] }))] })) })] }), selectedProvider && (_jsxs("div", { className: "text-xs text-gray-500 flex items-center mt-1", children: [_jsxs("span", { className: "mr-1 text-gray-400", children: [selectedProvider.provider, ":"] }), _jsx("span", { children: selectedProvider.modelName })] })), description && (_jsx("p", { className: "text-xs text-gray-500 mt-1", children: description }))] }));
};
