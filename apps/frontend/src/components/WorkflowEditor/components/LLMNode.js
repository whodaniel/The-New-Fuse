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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LLMSelector } from '@/components/LLMSelection/LLMSelector';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Settings, Sparkles, Code } from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from '@/components/ui/toast';
export var LLMNode = function (_a) {
    var id = _a.id, data = _a.data, isConnectable = _a.isConnectable;
    var _b = useState(false), testing = _b[0], setTesting = _b[1];
    var _c = useState(''), testInput = _c[0], setTestInput = _c[1];
    var _d = useState(''), testResult = _d[0], setTestResult = _d[1];
    var handleTestNode = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!data.prompt || !data.llmProviderId) {
                        toast.error('Please provide a prompt and select an LLM provider');
                        return [2 /*return*/];
                    }
                    setTesting(true);
                    setTestResult('');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, apiService.post('/api/workflow/test-node', {
                            nodeId: id,
                            llmProviderId: data.llmProviderId,
                            prompt: testInput ? data.prompt.replace('{{input}}', testInput) : data.prompt,
                            systemPrompt: data.systemPrompt,
                            maxTokens: data.maxTokens,
                            temperature: data.temperature
                        })];
                case 2:
                    response = _a.sent();
                    setTestResult(response.data.result || 'No result returned');
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error('Failed to test LLM node:', error_1);
                    setTestResult('Error: Failed to test LLM node');
                    return [3 /*break*/, 5];
                case 4:
                    setTesting(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs(Card, { className: "w-[320px] shadow-md border-2 border-primary/20", children: [_jsx(CardHeader, { className: "p-3 bg-primary/5", children: _jsxs(CardTitle, { className: "text-sm font-medium flex items-center", children: [_jsx(Bot, { className: "mr-2 h-4 w-4" }), _jsx("span", { className: "flex-1 truncate", children: data.label || 'LLM Node' })] }) }), _jsx(CardContent, { className: "p-3", children: _jsxs(Tabs, { defaultValue: "prompt", children: [_jsxs(TabsList, { className: "w-full", children: [_jsxs(TabsTrigger, { value: "prompt", className: "flex-1", children: [_jsx(Sparkles, { className: "mr-1 h-3 w-3" }), "Prompt"] }), _jsxs(TabsTrigger, { value: "settings", className: "flex-1", children: [_jsx(Settings, { className: "mr-1 h-3 w-3" }), "Settings"] }), _jsxs(TabsTrigger, { value: "test", className: "flex-1", children: [_jsx(Code, { className: "mr-1 h-3 w-3" }), "Test"] })] }), _jsxs(TabsContent, { value: "prompt", className: "mt-3 space-y-3", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "prompt", className: "text-xs", children: "Prompt" }), _jsx(Textarea, { id: "prompt", value: data.prompt, onChange: function (e) { return data.onPromptChange(e.target.value); }, placeholder: "Enter your prompt here... Use {{input}} for dynamic input", className: "resize-none h-20 text-xs" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "systemPrompt", className: "text-xs", children: "System Prompt (Optional)" }), _jsx(Textarea, { id: "systemPrompt", value: data.systemPrompt || '', onChange: function (e) { return data.onSystemPromptChange(e.target.value); }, placeholder: "Enter a system prompt to set the behavior of the AI", className: "resize-none h-16 text-xs" })] })] }), _jsxs(TabsContent, { value: "settings", className: "mt-3 space-y-3", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { className: "text-xs", children: "LLM Provider" }), _jsx(LLMSelector, { selectedProviderId: data.llmProviderId, onChange: data.onLLMProviderChange, description: "Select the LLM provider for this node" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "maxTokens", className: "text-xs", children: "Max Tokens" }), _jsx(Input, { id: "maxTokens", type: "number", value: data.maxTokens || 256, onChange: function (e) { return data.onMaxTokensChange(parseInt(e.target.value)); }, className: "text-xs", min: 1, max: 4096 })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "temperature", className: "text-xs", children: "Temperature" }), _jsx(Input, { id: "temperature", type: "number", value: data.temperature || 0.7, onChange: function (e) { return data.onTemperatureChange(parseFloat(e.target.value)); }, className: "text-xs", min: 0, max: 2, step: 0.1 })] })] })] }), _jsxs(TabsContent, { value: "test", className: "mt-3 space-y-3", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "testInput", className: "text-xs", children: "Test Input (Optional)" }), _jsx(Input, { id: "testInput", value: testInput, onChange: function (e) { return setTestInput(e.target.value); }, placeholder: "Input to replace {{input}} in your prompt", className: "text-xs" })] }), _jsx(Button, { size: "sm", onClick: handleTestNode, disabled: testing, className: "w-full text-xs", children: testing ? 'Testing...' : 'Test Node' }), testResult && (_jsxs("div", { className: "space-y-1 mt-2", children: [_jsx(Label, { className: "text-xs", children: "Result:" }), _jsx("div", { className: "p-2 border rounded-md bg-theme-bg-secondary text-xs overflow-auto max-h-24", children: testResult })] }))] })] }) }), _jsx(Handle, { type: "target", position: Position.Left, id: "input", className: "w-2 h-2 -ml-1 bg-primary", isConnectable: isConnectable }), _jsx(Handle, { type: "source", position: Position.Right, id: "output", className: "w-2 h-2 -mr-1 bg-primary", isConnectable: isConnectable })] }));
};
