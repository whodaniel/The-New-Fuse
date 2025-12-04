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
import { BaseLayout } from '@/components/layout/BaseLayout';
import { AgentForm } from '@/components/agents/AgentForm';
import { AgentMetricsDisplay } from '@/components/agents/AgentMetrics';
import { AgentFilters } from '@/components/agents/AgentFilters';
import { Card } from '@/components/ui/card';
import { toast } from 'react-toastify';
export default function AgentsPage() {
    var _this = this;
    var _a = useState(null), selectedAgentId = _a[0], setSelectedAgentId = _a[1];
    var _b = useState({
        status: 'all',
    }), filters = _b[0], setFilters = _b[1];
    var handleAgentSubmit = function (data) { return __awaiter(_this, void 0, void 0, function () {
        var response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch('/api/agents', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data),
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('Failed to create agent');
                    toast.success('Agent created successfully');
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error('Error creating agent:', error_1);
                    toast.error('Failed to create agent');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var handleMetricsUpdate = function (metrics) {
    };
    return (_jsx(BaseLayout, { className: "p-6", showSidebar: true, showHeader: true, children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs("div", { className: "md:col-span-2", children: [_jsx(Card, { children: _jsxs("div", { className: "p-6", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "Create New Agent" }), _jsx(AgentForm, { onSubmit: handleAgentSubmit, availableModels: ['gpt-4', 'gpt-3.5-turbo', 'claude-v1'], availableCapabilities: [
                                            'text-generation',
                                            'code-generation',
                                            'image-generation',
                                            'audio-processing'
                                        ] })] }) }), selectedAgentId && (_jsx(Card, { className: "mt-6", children: _jsxs("div", { className: "p-6", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "Agent Metrics" }), _jsx(AgentMetricsDisplay, { agentId: selectedAgentId, refreshInterval: 30000, onMetricsUpdate: handleMetricsUpdate })] }) }))] }), _jsx("div", { children: _jsx(AgentFilters, { filters: filters, onFilterChange: setFilters, availableCapabilities: [
                            'text-generation',
                            'code-generation',
                            'image-generation',
                            'audio-processing'
                        ], availableModels: ['gpt-4', 'gpt-3.5-turbo', 'claude-v1'] }) })] }) }));
}
