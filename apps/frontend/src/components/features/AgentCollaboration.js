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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentCollaboration = void 0;
import react_1 from 'react';
import react_query_1 from '@tanstack/react-query';
import Card_1 from '../../../core/Card';
import Button_1 from '../../../core/Button';
import Select_1 from '../../../core/Select';
import agentService_1 from '../../../../services/api/agentService';
import websocket_1 from '../../../../services/websocket';
import react_hot_toast_1 from 'react-hot-toast';
var AgentCollaboration = function () {
    var _a = (0, react_1.useState)([]), selectedAgents = _a[0], setSelectedAgents = _a[1];
    var _b = (0, react_1.useState)([]), collaboratingAgents = _b[0], setCollaboratingAgents = _b[1];
    var _c = (0, react_1.useState)(false), isCollaborating = _c[0], setIsCollaborating = _c[1];
    var _d = (0, react_query_1.useQuery)({
        queryKey: ['agents'],
        queryFn: agentService_1.agentService.getAllAgents,
    }).data, agents = _d === void 0 ? [] : _d;
    var startCollaborationMutation = (0, react_query_1.useMutation)({
        mutationFn: function (agentIds) { return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agentService_1.agentService.startCollaboration(agentIds)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response];
                }
            });
        }); },
        onSuccess: function (data) {
            setIsCollaborating(true);
            react_hot_toast_1.toast.success('Collaboration started successfully');
            websocket_1.default.sendMessage({
                type: 'agent_action',
                payload: {
                    action: 'collaboration_started',
                    agents: data.agents,
                },
                sender: {
                    id: 'system',
                    type: 'system',
                    name: 'System',
                },
            });
        },
        onError: function (error) {
            react_hot_toast_1.toast.error('Failed to start collaboration');
            console.error('Collaboration error:', error);
        },
    });
    var stopCollaborationMutation = (0, react_query_1.useMutation)({
        mutationFn: function () { return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agentService_1.agentService.stopCollaboration()];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response];
                }
            });
        }); },
        onSuccess: function () {
            setIsCollaborating(false);
            setCollaboratingAgents([]);
            react_hot_toast_1.toast.success('Collaboration stopped');
        },
        onError: function (error) {
            react_hot_toast_1.toast.error('Failed to stop collaboration');
            console.error('Stop collaboration error:', error);
        },
    });
    (0, react_1.useEffect)(function () {
        var unsubscribe = websocket_1.default.onMessage(function (message) {
            if (message.type === 'agent_action') {
                switch (message.payload.action) {
                    case 'agent_joined_collaboration':
                        setCollaboratingAgents(function (prev) { return __spreadArray(__spreadArray([], prev, true), [message.payload.agent], false); });
                        react_hot_toast_1.toast.success("".concat(message.payload.agent.name, " joined the collaboration"));
                        break;
                    case 'agent_left_collaboration':
                        setCollaboratingAgents(function (prev) { return prev.filter(function (agent) { return agent.id !== message.payload.agentId; }); });
                        react_hot_toast_1.toast.info("An agent left the collaboration");
                        break;
                    case 'collaboration_progress':
                        react_hot_toast_1.toast.success(message.payload.message);
                        break;
                }
            }
        });
        return unsubscribe;
    }, []);
    var handleStartCollaboration = function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (selectedAgents.length < 2) {
                react_hot_toast_1.toast.error('Please select at least 2 agents');
                return [2 /*return*/];
            }
            startCollaborationMutation.mutate(selectedAgents);
            return [2 /*return*/];
        });
    }); };
    var handleStopCollaboration = function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (window.confirm('Are you sure you want to stop the collaboration?')) {
                stopCollaborationMutation.mutate();
            }
            return [2 /*return*/];
        });
    }); };
    return (_jsxs(Card_1.Card, { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Agent Collaboration" }), isCollaborating ? (_jsx(Button_1.Button, { variant: "destructive", onClick: handleStopCollaboration, disabled: stopCollaborationMutation.isPending, children: "Stop Collaboration" })) : (_jsx(Button_1.Button, { onClick: handleStartCollaboration, disabled: startCollaborationMutation.isPending ||
                            selectedAgents.length < 2, children: "Start Collaboration" }))] }), !isCollaborating && (_jsxs("div", { className: "mb-6", children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Select Agents to Collaborate" }), _jsx(Select_1.Select, { multiple: true, value: selectedAgents, onChange: function (e) {
                            var options = e.target;
                            var values = Array.from(options.selectedOptions).map(function (option) { return option.value; });
                            setSelectedAgents(values);
                        }, className: "w-full", children: agents.map(function (agent) { return (_jsxs("option", { value: agent.id, children: [agent.name, " (", agent.type, ")"] }, agent.id)); }) }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Select at least 2 agents to start collaboration" })] })), isCollaborating && collaboratingAgents.length > 0 && (_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-medium", children: "Active Collaboration" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: collaboratingAgents.map(function (agent) { return (_jsxs(Card_1.Card, { className: "p-4", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-medium", children: agent.name }), _jsx("p", { className: "text-sm text-gray-500", children: agent.type })] }), _jsx("span", { className: "px-2 py-1 rounded-full text-xs ".concat(agent.status === 'active' ? 'bg-green-100 text-green-800' :
                                                'bg-yellow-100 text-yellow-800'), children: agent.status })] }), _jsx("div", { className: "mt-2", children: _jsx("span", { className: "text-xs font-medium px-2 py-1 bg-primary/10 rounded-full", children: agent.role === 'leader' ? '👑 Leader' : '👤 Member' }) })] }, agent.id)); }) })] }))] }));
};
exports.AgentCollaboration = AgentCollaboration;
exports.default = exports.AgentCollaboration;
