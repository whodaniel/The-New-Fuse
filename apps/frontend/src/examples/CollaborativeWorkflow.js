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
import { useEffect, useState } from 'react';
import { useWorkflowIntegration } from '../hooks/useWorkflowIntegration';
import { useWebSocket } from '../hooks/useWebSocket';
export function CollaborativeWorkflow() {
    var _this = this;
    var _a = useState(null), session = _a[0], setSession = _a[1];
    var _b = useWebSocket(), subscribe = _b.subscribe, send = _b.send;
    var _c = useWorkflowIntegration(), startWorkflow = _c.startWorkflow, stopWorkflow = _c.stopWorkflow;
    useEffect(function () {
        var subscriptions = [
            subscribe('session_update', function (sessionData) {
                setSession(sessionData);
            }),
            subscribe('participant_joined', function (agent) {
                setSession(function (prev) { return prev ? __assign(__assign({}, prev), { participants: __spreadArray(__spreadArray([], prev.participants, true), [agent], false) }) : null; });
            }),
            subscribe('participant_left', function (agentId) {
                setSession(function (prev) { return prev ? __assign(__assign({}, prev), { participants: prev.participants.filter(function (p) { return p.id !== agentId; }) }) : null; });
            })
        ];
        // Initialize session
        send('join_session', {
            capabilities: ['data-analysis', 'visualization', 'statistics']
        });
        return function () {
            subscriptions.forEach(function (unsubscribe) { return unsubscribe(); });
            send('leave_session');
        };
    }, [subscribe, send]);
    var handleStartCollaboration = function () { return __awaiter(_this, void 0, void 0, function () {
        var workflow, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!session)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, startWorkflow({
                            type: 'collaborative',
                            participants: session.participants.map(function (p) { return p.id; }),
                            context: session.sharedContext
                        })];
                case 2:
                    workflow = _a.sent();
                    send('workflow_started', { workflowId: workflow.id });
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Failed to start collaborative workflow:', error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    if (!session) {
        return _jsx("div", { children: "Connecting to session..." });
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsxs("h2", { className: "text-xl font-semibold mb-4", children: ["Collaborative Session: ", session.id] }), _jsxs("div", { className: "mb-6", children: [_jsx("h3", { className: "font-medium mb-2", children: "Participants" }), _jsx("div", { className: "grid grid-cols-2 gap-4", children: session.participants.map(function (agent) { return (_jsxs("div", { className: "border rounded p-3 flex items-center", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-medium", children: agent.name }), _jsx("div", { className: "text-sm text-gray-500", children: agent.capabilities.join(', ') })] }), _jsx("div", { className: "h-3 w-3 rounded-full bg-green-500" })] }, agent.id)); }) })] }), _jsxs("div", { className: "mb-6", children: [_jsx("h3", { className: "font-medium mb-2", children: "Active Workflows" }), _jsx("div", { className: "space-y-2", children: session.activeWorkflows.map(function (workflowId) { return (_jsxs("div", { className: "flex items-center justify-between border rounded p-3", children: [_jsx("span", { children: workflowId }), _jsx("button", { className: "text-red-500 hover:text-red-700", onClick: function () { return stopWorkflow(workflowId); }, children: "Stop" })] }, workflowId)); }) })] }), _jsx("button", { className: "bg-blue-500 text-white px-4 py-2 rounded", onClick: handleStartCollaboration, children: "Start Collaborative Workflow" })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "font-medium mb-2", children: "Shared Context" }), _jsx("pre", { className: "bg-gray-100 p-4 rounded", children: JSON.stringify(session.sharedContext, null, 2) })] })] }));
}
