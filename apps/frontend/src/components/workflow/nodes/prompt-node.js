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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useState, useEffect } from 'react';
import { BaseNode } from './base-node';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
var PromptNode = memo(function (_a) {
    var id = _a.id, data = _a.data;
    var _b = useState([]), promptTemplates = _b[0], setPromptTemplates = _b[1];
    var _c = useState(null), selectedTemplate = _c[0], setSelectedTemplate = _c[1];
    var _d = useState(''), customPrompt = _d[0], setCustomPrompt = _d[1];
    var _e = useState([]), variables = _e[0], setVariables = _e[1];
    // Load prompt templates
    useEffect(function () {
        loadPromptTemplates();
    }, []);
    // Extract variables from prompt template
    useEffect(function () {
        var template = (selectedTemplate === null || selectedTemplate === void 0 ? void 0 : selectedTemplate.template) || customPrompt;
        if (template) {
            var variableMatches = template.match(/\{\{(\w+)\}\}/g);
            var extractedVars = variableMatches
                ? variableMatches.map(function (match) { return match.replace(/\{\{|\}\}/g, ''); })
                : [];
            setVariables(__spreadArray([], new Set(extractedVars), true));
        }
        else {
            setVariables([]);
        }
    }, [selectedTemplate, customPrompt]);
    var loadPromptTemplates = function () { return __awaiter(void 0, void 0, void 0, function () {
        var templates, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    if (!window.electronAPI) return [3 /*break*/, 2];
                    return [4 /*yield*/, window.electronAPI.getPromptTemplates()];
                case 1:
                    templates = _a.sent();
                    setPromptTemplates(templates || getDefaultTemplates());
                    return [3 /*break*/, 3];
                case 2:
                    // Browser mode - use default templates
                    setPromptTemplates(getDefaultTemplates());
                    _a.label = 3;
                case 3: return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error('Failed to load prompt templates:', error_1);
                    setPromptTemplates(getDefaultTemplates());
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var getDefaultTemplates = function () { return [
        {
            id: 'agent_task',
            name: 'Agent Task Assignment',
            description: 'Template for assigning tasks to AI agents',
            category: 'agent',
            tags: ['task', 'assignment', 'agent'],
            template: 'You are an AI agent with the following capabilities: {{capabilities}}. Please complete this task: {{task}}. Context: {{context}}'
        },
        {
            id: 'code_review',
            name: 'Code Review Request',
            description: 'Template for requesting code reviews',
            category: 'development',
            tags: ['code', 'review', 'development'],
            template: 'Please review the following {{language}} code and provide feedback on:\n1. Code quality\n2. Best practices\n3. Potential issues\n4. Suggestions for improvement\n\nCode:\n```{{language}}\n{{code}}\n```'
        },
        {
            id: 'error_analysis',
            name: 'Error Analysis',
            description: 'Template for analyzing errors and bugs',
            category: 'debugging',
            tags: ['error', 'analysis', 'debugging'],
            template: 'Analyze the following error and provide:\n1. Root cause analysis\n2. Potential solutions\n3. Prevention strategies\n\nError: {{error}}\nContext: {{context}}\nStack trace: {{stackTrace}}'
        },
        {
            id: 'custom',
            name: 'Custom Prompt',
            description: 'Write your own custom prompt',
            category: 'custom',
            tags: ['custom'],
            template: ''
        }
    ]; };
    var handleTemplateChange = function (templateId) {
        var _a, _b;
        var template = promptTemplates.find(function (t) { return t.id === templateId; });
        setSelectedTemplate(template || null);
        if ((template === null || template === void 0 ? void 0 : template.id) === 'custom') {
            setCustomPrompt(((_a = data.config) === null || _a === void 0 ? void 0 : _a.customPrompt) || '');
        }
        else {
            setCustomPrompt('');
        }
        if (data.onUpdate) {
            data.onUpdate({
                name: (template === null || template === void 0 ? void 0 : template.name) || 'Prompt',
                config: __assign(__assign({}, data.config), { templateId: templateId, template: (template === null || template === void 0 ? void 0 : template.template) || '', customPrompt: (template === null || template === void 0 ? void 0 : template.id) === 'custom' ? (((_b = data.config) === null || _b === void 0 ? void 0 : _b.customPrompt) || '') : '' })
            });
        }
    };
    var handleCustomPromptChange = function (value) {
        setCustomPrompt(value);
        if (data.onUpdate) {
            data.onUpdate({
                name: 'Custom Prompt',
                config: __assign(__assign({}, data.config), { customPrompt: value, template: value })
            });
        }
    };
    // Initialize selected template from data
    useEffect(function () {
        var _a, _b;
        if (((_a = data.config) === null || _a === void 0 ? void 0 : _a.templateId) && promptTemplates.length > 0) {
            var template = promptTemplates.find(function (t) { return t.id === data.config.templateId; });
            if (template) {
                setSelectedTemplate(template);
                if (template.id === 'custom') {
                    setCustomPrompt(((_b = data.config) === null || _b === void 0 ? void 0 : _b.customPrompt) || '');
                }
            }
        }
    }, [data.config, promptTemplates]);
    var inputHandles = __spreadArray([
        { id: 'trigger', label: 'Trigger' }
    ], variables.map(function (variable) { return ({
        id: "var_".concat(variable),
        label: variable
    }); }), true);
    var outputHandles = [
        { id: 'prompt', label: 'Generated Prompt' },
        { id: 'error', label: 'Error' }
    ];
    var renderContent = function () {
        var _a;
        return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "template-".concat(id), className: "text-xs", children: "Template" }), _jsxs(Select, { value: ((_a = data.config) === null || _a === void 0 ? void 0 : _a.templateId) || '', onValueChange: handleTemplateChange, children: [_jsx(SelectTrigger, { id: "template-".concat(id), className: "text-xs h-8 mt-1", children: _jsx(SelectValue, { placeholder: "Select template" }) }), _jsx(SelectContent, { children: promptTemplates.map(function (template) { return (_jsx(SelectItem, { value: template.id, className: "text-xs", children: template.name }, template.id)); }) })] })] }), selectedTemplate && selectedTemplate.id !== 'custom' && (_jsxs("div", { className: "text-xs", children: [_jsx(Label, { children: "Description" }), _jsx("p", { className: "text-muted-foreground mt-1", children: selectedTemplate.description }), selectedTemplate.tags.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-1 mt-2", children: selectedTemplate.tags.map(function (tag) { return (_jsx(Badge, { variant: "secondary", className: "text-xs", children: tag }, tag)); }) }))] })), (selectedTemplate === null || selectedTemplate === void 0 ? void 0 : selectedTemplate.id) === 'custom' && (_jsxs("div", { children: [_jsx(Label, { htmlFor: "custom-prompt-".concat(id), className: "text-xs", children: "Custom Prompt" }), _jsx(Textarea, { id: "custom-prompt-".concat(id), value: customPrompt, onChange: function (e) { return handleCustomPromptChange(e.target.value); }, placeholder: "Enter your custom prompt here...", className: "text-xs mt-1 min-h-[100px]" })] })), variables.length > 0 && (_jsxs("div", { children: [_jsx(Label, { className: "text-xs", children: "Variables" }), _jsx("div", { className: "flex flex-wrap gap-1 mt-1", children: variables.map(function (variable) { return (_jsx(Badge, { variant: "outline", className: "text-xs", children: "{{".concat(variable, "}}") }, variable)); }) })] }))] }));
    };
    return (_jsx(BaseNode, { id: id, data: __assign(__assign({}, data), { name: (selectedTemplate === null || selectedTemplate === void 0 ? void 0 : selectedTemplate.name) || data.name || 'Prompt', type: 'prompt', renderContent: renderContent }), inputHandles: inputHandles, outputHandles: outputHandles }));
});
PromptNode.displayName = 'PromptNode';
export { PromptNode };
