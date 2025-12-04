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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { useWorkflowIntegration } from '../hooks/useWorkflowIntegration';
import { AgentWorkflowManager } from '../components/AgentWorkflowManager';
import { StatusMonitor } from '../components/StatusMonitor';
import { DataAnalysisTool } from '../types/core/tools/data-analysis';
import { VisualizationTool } from '../types/core/tools/visualization';
import { StatisticalTool } from '../types/core/tools/statistical';
export function AdvancedWorkflowIntegration() {
    var _this = this;
    var _a = useState({
        dataset: '',
        metrics: [],
        visualizations: [],
        outputFormat: 'json'
    }), analysisConfig = _a[0], setAnalysisConfig = _a[1];
    var _b = useWorkflowIntegration(), isConnected = _b.isConnected, activeWorkflows = _b.activeWorkflows, startWorkflow = _b.startWorkflow, stopWorkflow = _b.stopWorkflow;
    var handleAnalysisStart = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var tools, workflow, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tools = [
                        new DataAnalysisTool(),
                        new VisualizationTool(),
                        new StatisticalTool()
                    ];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, startWorkflow({
                            type: 'analysis',
                            config: analysisConfig,
                            tools: tools.map(function (tool) { return ({
                                name: tool.name,
                                description: tool.description
                            }); })
                        })];
                case 2:
                    workflow = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Failed to start analysis:', error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [analysisConfig, startWorkflow]);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Analysis Configuration" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Dataset" }), _jsx("input", { type: "text", className: "w-full border rounded p-2", value: analysisConfig.dataset, onChange: function (e) { return setAnalysisConfig(function (prev) { return (__assign(__assign({}, prev), { dataset: e.target.value })); }); } })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Metrics" }), _jsxs("select", { multiple: true, className: "w-full border rounded p-2", value: analysisConfig.metrics, onChange: function (e) { return setAnalysisConfig(function (prev) { return (__assign(__assign({}, prev), { metrics: Array.from(e.target.selectedOptions, function (option) { return option.value; }) })); }); }, children: [_jsx("option", { value: "revenue", children: "Revenue Analysis" }), _jsx("option", { value: "trends", children: "Trend Analysis" }), _jsx("option", { value: "segments", children: "Segment Analysis" }), _jsx("option", { value: "forecasting", children: "Forecasting" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Output Format" }), _jsxs("select", { className: "w-full border rounded p-2", value: analysisConfig.outputFormat, onChange: function (e) { return setAnalysisConfig(function (prev) { return (__assign(__assign({}, prev), { outputFormat: e.target.value })); }); }, children: [_jsx("option", { value: "json", children: "JSON" }), _jsx("option", { value: "csv", children: "CSV" }), _jsx("option", { value: "markdown", children: "Markdown" })] })] }), _jsx("button", { className: "bg-blue-500 text-white px-4 py-2 rounded", onClick: handleAnalysisStart, disabled: !isConnected, children: "Start Analysis" })] })] }), _jsx(AgentWorkflowManager, {}), _jsx(StatusMonitor, {}), _jsxs("div", { className: "bg-gray-100 rounded-lg p-4", children: [_jsxs("h3", { className: "font-medium mb-2", children: ["Active Workflows: ", activeWorkflows] }), _jsx("pre", { className: "bg-white p-4 rounded", children: JSON.stringify(analysisConfig, null, 2) })] })] }));
}
