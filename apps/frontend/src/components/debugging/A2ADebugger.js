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
// A2A Debugger Component - Real-time debugging interface for multi-agent communication
// Provides comprehensive debugging tools with message tracing, conversation analysis, and real-time monitoring
import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, } from 'recharts';
var A2ADebugger = function () {
    // State management
    var _a = useState(0), activeTab = _a[0], setActiveTab = _a[1];
    var _b = useState([]), debugSessions = _b[0], setDebugSessions = _b[1];
    var _c = useState(null), activeSession = _c[0], setActiveSession = _c[1];
    var _d = useState([]), capturedMessages = _d[0], setCapturedMessages = _d[1];
    var _e = useState([]), conversations = _e[0], setConversations = _e[1];
    var _f = useState([]), agents = _f[0], setAgents = _f[1];
    var _g = useState([]), filters = _g[0], setFilters = _g[1];
    var _h = useState(false), isCapturing = _h[0], setIsCapturing = _h[1];
    var _j = useState(null), selectedMessage = _j[0], setSelectedMessage = _j[1];
    var _k = useState(false), createSessionDialog = _k[0], setCreateSessionDialog = _k[1];
    var _l = useState(false), filtersDialog = _l[0], setFiltersDialog = _l[1];
    var _m = useState(true), realTimeUpdates = _m[0], setRealTimeUpdates = _m[1];
    // Form states
    var _o = useState(''), newSessionName = _o[0], setNewSessionName = _o[1];
    var _p = useState(''), newSessionDescription = _p[0], setNewSessionDescription = _p[1];
    // Real-time connection
    var eventSourceRef = useRef(null);
    // Load initial data
    useEffect(function () {
        loadDebugSessions();
        loadAgents();
    }, []);
    // Real-time updates
    useEffect(function () {
        if (activeSession && realTimeUpdates) {
            connectToRealTimeUpdates(activeSession.id);
        }
        return function () {
            disconnectRealTimeUpdates();
        };
    }, [activeSession, realTimeUpdates]);
    var connectToRealTimeUpdates = function (sessionId) {
        disconnectRealTimeUpdates();
        eventSourceRef.current = new EventSource("/api/debugging/sessions/".concat(sessionId, "/stream"));
        eventSourceRef.current.onmessage = function (event) {
            var data = JSON.parse(event.data);
            switch (data.type) {
                case 'messageCapture':
                    handleNewMessage(data.message);
                    break;
                case 'conversationUpdate':
                    handleConversationUpdate(data.conversation);
                    break;
                case 'agentUpdate':
                    handleAgentUpdate(data.agent);
                    break;
            }
        };
        eventSourceRef.current.onerror = function () {
            console.error('Real-time connection error');
            setTimeout(function () { return connectToRealTimeUpdates(sessionId); }, 5000); // Retry after 5 seconds
        };
    };
    var disconnectRealTimeUpdates = function () {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
    };
    var handleNewMessage = function (message) {
        setCapturedMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [message], false).slice(-1000); }); // Keep last 1000 messages
    };
    var handleConversationUpdate = function (conversation) {
        setConversations(function (prev) {
            var index = prev.findIndex(function (c) { return c.id === conversation.id; });
            if (index >= 0) {
                var newConversations = __spreadArray([], prev, true);
                newConversations[index] = conversation;
                return newConversations;
            }
            return __spreadArray(__spreadArray([], prev, true), [conversation], false);
        });
    };
    var handleAgentUpdate = function (agent) {
        setAgents(function (prev) {
            var index = prev.findIndex(function (a) { return a.id === agent.id; });
            if (index >= 0) {
                var newAgents = __spreadArray([], prev, true);
                newAgents[index] = agent;
                return newAgents;
            }
            return __spreadArray(__spreadArray([], prev, true), [agent], false);
        });
    };
    // API calls
    var loadDebugSessions = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, sessions, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch('/api/debugging/sessions')];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    sessions = _a.sent();
                    setDebugSessions(sessions);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error loading debug sessions:', error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var loadAgents = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, agentList, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch('/api/debugging/agents')];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    agentList = _a.sent();
                    setAgents(agentList);
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error('Error loading agents:', error_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var createDebugSession = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, result, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, fetch('/api/debugging/sessions', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name: newSessionName,
                                description: newSessionDescription,
                                settings: {
                                    capturePayloads: true,
                                    realTimeUpdates: true,
                                    maxMessages: 5000,
                                },
                            }),
                        })];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    result = _a.sent();
                    if (!result.sessionId) return [3 /*break*/, 4];
                    return [4 /*yield*/, loadDebugSessions()];
                case 3:
                    _a.sent();
                    setCreateSessionDialog(false);
                    setNewSessionName('');
                    setNewSessionDescription('');
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    error_3 = _a.sent();
                    console.error('Error creating debug session:', error_3);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var startCapturing = function (sessionId) { return __awaiter(void 0, void 0, void 0, function () {
        var session, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch("/api/debugging/sessions/".concat(sessionId, "/active"), { method: 'PUT' })];
                case 1:
                    _a.sent();
                    setIsCapturing(true);
                    session = debugSessions.find(function (s) { return s.id === sessionId; });
                    if (session) {
                        setActiveSession(session);
                        loadSessionMessages(sessionId);
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_4 = _a.sent();
                    console.error('Error starting capture:', error_4);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var stopCapturing = function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!activeSession)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetch("/api/debugging/sessions/".concat(activeSession.id, "/stop"), { method: 'PUT' })];
                case 2:
                    _a.sent();
                    setIsCapturing(false);
                    setActiveSession(null);
                    disconnectRealTimeUpdates();
                    return [3 /*break*/, 4];
                case 3:
                    error_5 = _a.sent();
                    console.error('Error stopping capture:', error_5);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var loadSessionMessages = function (sessionId) { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("/api/debugging/sessions/".concat(sessionId, "/messages"))];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setCapturedMessages(data.messages);
                    return [3 /*break*/, 4];
                case 3:
                    error_6 = _a.sent();
                    console.error('Error loading messages:', error_6);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var exportSession = function (sessionId) { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, blob, url, a, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("/api/debugging/sessions/".concat(sessionId, "/export"))];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    url = URL.createObjectURL(blob);
                    a = document.createElement('a');
                    a.href = url;
                    a.download = "debug-session-".concat(sessionId, ".json");
                    a.click();
                    URL.revokeObjectURL(url);
                    return [3 /*break*/, 4];
                case 3:
                    error_7 = _a.sent();
                    console.error('Error exporting session:', error_7);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var analyzeMessage = function (messageId) { return __awaiter(void 0, void 0, void 0, function () {
        var response, analysis, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("/api/debugging/messages/".concat(messageId, "/analyze"), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ includeRecommendations: true }),
                        })];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    analysis = _a.sent();
                    console.log('Message analysis:', analysis);
                    return [3 /*break*/, 4];
                case 3:
                    error_8 = _a.sent();
                    console.error('Error analyzing message:', error_8);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Utility functions
    var getStatusIcon = function (status) {
        switch (status) {
            case 'processed': return _jsx(CheckCircleIcon, { color: "success" });
            case 'failed': return _jsx(ErrorIcon, { color: "error" });
            case 'timeout': return _jsx(WarningIcon, { color: "warning" });
            case 'sent': return _jsx(MessageIcon, { color: "info" });
            default: return _jsx(InfoIcon, {});
        }
    };
    var getStatusColor = function (status) {
        switch (status) {
            case 'processed': return 'success';
            case 'failed': return 'error';
            case 'timeout': return 'warning';
            case 'sent': return 'info';
            default: return 'default';
        }
    };
    var formatLatency = function (latency) {
        if (!latency)
            return 'N/A';
        return latency < 1000 ? "".concat(latency, "ms") : "".concat((latency / 1000).toFixed(2), "s");
    };
    var formatTimestamp = function (timestamp) {
        return new Date(timestamp).toLocaleTimeString();
    };
    // Chart data preparation
    var prepareLatencyChart = function () {
        return capturedMessages
            .filter(function (msg) { return msg.performanceMetrics.totalLatency; })
            .slice(-50) // Last 50 messages
            .map(function (msg, index) { return ({
            index: index,
            latency: msg.performanceMetrics.totalLatency,
            timestamp: formatTimestamp(msg.timestamp),
        }); });
    };
    var prepareMessageTypeChart = function () {
        var typeCounts = capturedMessages.reduce(function (acc, msg) {
            acc[msg.messageType] = (acc[msg.messageType] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(typeCounts).map(function (_a) {
            var type = _a[0], count = _a[1];
            return ({
                messageType: type,
                count: count,
            });
        });
    };
    return (_jsxs(Box, { sx: { p: 3 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }, children: [_jsx(Text, { variant: "h4", component: "h1", children: "A2A Communication Debugger" }), _jsxs(Box, { sx: { display: 'flex', gap: 2 }, children: [_jsx(FormLabel, { control: _jsx(Switch, { checked: realTimeUpdates, onChange: function (e) { return setRealTimeUpdates(e.target.checked); } }), label: "Real-time Updates" }), _jsx(Button, { variant: "contained", startIcon: _jsx(BugReportIcon, {}), onClick: function () { return setCreateSessionDialog(true); }, children: "New Debug Session" })] })] }), _jsx(Card, { sx: { mb: 3 }, children: _jsx(CardBody, { children: _jsxs(SimpleGrid, { container: true, columns: 3, children: [_jsx(SimpleGrid, { item: true, xs: 12, sm: 3, children: _jsxs(Box, { sx: { textAlign: 'center' }, children: [_jsx(Text, { variant: "h6", color: "textSecondary", children: "Active Session" }), _jsx(Text, { variant: "h5", children: activeSession ? activeSession.name : 'None' })] }) }), _jsx(SimpleGrid, { item: true, xs: 12, sm: 3, children: _jsxs(Box, { sx: { textAlign: 'center' }, children: [_jsx(Text, { variant: "h6", color: "textSecondary", children: "Capturing" }), _jsx(Tag, { label: isCapturing ? 'Active' : 'Stopped', color: isCapturing ? 'success' : 'default', icon: isCapturing ? _jsx(PlayIcon, {}) : _jsx(StopIcon, {}) })] }) }), _jsx(SimpleGrid, { item: true, xs: 12, sm: 3, children: _jsxs(Box, { sx: { textAlign: 'center' }, children: [_jsx(Text, { variant: "h6", color: "textSecondary", children: "Messages Captured" }), _jsx(Text, { variant: "h5", children: capturedMessages.length })] }) }), _jsx(SimpleGrid, { item: true, xs: 12, sm: 3, children: _jsxs(Box, { sx: { textAlign: 'center' }, children: [_jsx(Text, { variant: "h6", color: "textSecondary", children: "Active Agents" }), _jsx(Text, { variant: "h5", children: agents.filter(function (a) { return a.status === 'online'; }).length })] }) })] }) }) }), _jsx(Card, { sx: { mb: 3 }, children: _jsx(CardBody, { children: _jsxs(SimpleGrid, { container: true, columns: 2, alignItems: "center", children: [_jsx(SimpleGrid, { item: true, xs: 12, sm: 4, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Debug Session" }), _jsx(Select, { value: (activeSession === null || activeSession === void 0 ? void 0 : activeSession.id) || '', onChange: function (e) {
                                                var session = debugSessions.find(function (s) { return s.id === e.target.value; });
                                                setActiveSession(session || null);
                                            }, children: debugSessions.map(function (session) { return (_jsxs(Option, { value: session.id, children: [session.name, " (", session.status, ")"] }, session.id)); }) })] }) }), _jsx(SimpleGrid, { item: true, xs: 12, sm: 8, children: _jsxs(Box, { sx: { display: 'flex', gap: 1 }, children: [_jsx(Button, { variant: "contained", startIcon: _jsx(PlayIcon, {}), onClick: function () { return activeSession && startCapturing(activeSession.id); }, disabled: isCapturing || !activeSession, color: "success", children: "Start Capture" }), _jsx(Button, { variant: "contained", startIcon: _jsx(StopIcon, {}), onClick: stopCapturing, disabled: !isCapturing, color: "error", children: "Stop Capture" }), _jsx(Button, { variant: "outlined", startIcon: _jsx(FilterIcon, {}), onClick: function () { return setFiltersDialog(true); }, children: "Filters" }), _jsx(Button, { variant: "outlined", startIcon: _jsx(DownloadIcon, {}), onClick: function () { return activeSession && exportSession(activeSession.id); }, disabled: !activeSession, children: "Export" }), _jsx(Button, { variant: "outlined", startIcon: _jsx(RefreshIcon, {}), onClick: loadDebugSessions, children: "Refresh" })] }) })] }) }) }), _jsxs(Card, { children: [_jsxs(Tabs, { value: activeTab, onChange: function (e, newValue) { return setActiveTab(newValue); }, children: [_jsx(Tab, { label: "Message Trace", icon: _jsx(MessageIcon, {}) }), _jsx(Tab, { label: "Conversations", icon: _jsx(TimelineIcon, {}) }), _jsx(Tab, { label: "Agents", icon: _jsx(AgentIcon, {}) }), _jsx(Tab, { label: "Analytics", icon: _jsx(SpeedIcon, {}) })] }), _jsxs(CardBody, { children: [activeTab === 0 && (_jsx(Box, { children: _jsx(TableContainer, { component: Paper, sx: { maxHeight: 600 }, children: _jsxs(Table, { stickyHeader: true, children: [_jsx(Thead, { children: _jsxs(Tr, { children: [_jsx(Td, { children: "Status" }), _jsx(Td, { children: "Timestamp" }), _jsx(Td, { children: "From Agent" }), _jsx(Td, { children: "To Agent" }), _jsx(Td, { children: "Message Type" }), _jsx(Td, { children: "Latency" }), _jsx(Td, { children: "Priority" }), _jsx(Td, { children: "Actions" })] }) }), _jsx(Tbody, { children: capturedMessages.map(function (message) { return (_jsxs(Tr, { hover: true, children: [_jsx(Td, { children: _jsx(Tag, { icon: getStatusIcon(message.status), label: message.status, color: getStatusColor(message.status), size: "small" }) }), _jsx(Td, { children: formatTimestamp(message.timestamp) }), _jsx(Td, { children: message.fromAgent }), _jsx(Td, { children: message.toAgent }), _jsx(Td, { children: message.messageType }), _jsx(Td, { children: formatLatency(message.performanceMetrics.totalLatency) }), _jsx(Td, { children: _jsx(Tag, { label: message.priority, color: message.priority <= 2 ? 'error' : message.priority <= 3 ? 'warning' : 'default', size: "small" }) }), _jsxs(Td, { children: [_jsx(Tooltip, { title: "Analyze Message", children: _jsx(IconButton, { size: "small", onClick: function () { return analyzeMessage(message.messageId); }, children: _jsx(BugReportIcon, {}) }) }), _jsx(Tooltip, { title: "View Details", children: _jsx(IconButton, { size: "small", onClick: function () { return setSelectedMessage(message); }, children: _jsx(InfoIcon, {}) }) })] })] }, message.id)); }) })] }) }) })), activeTab === 1 && (_jsxs(Box, { children: [_jsx(Text, { variant: "h6", sx: { mb: 2 }, children: "Active Conversations" }), conversations.map(function (conversation) { return (_jsxs(Accordion, { children: [_jsx(AccordionSummary, { expandIcon: _jsx(ExpandMoreIcon, {}), children: _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 2, width: '100%' }, children: [_jsx(Tag, { label: conversation.status, color: conversation.status === 'active' ? 'success' : 'default', size: "small" }), _jsx(Text, { variant: "body1", children: conversation.participants.join(' ↔ ') }), _jsxs(Text, { variant: "body2", color: "textSecondary", sx: { ml: 'auto' }, children: [conversation.summary.totalMessages, " messages"] })] }) }), _jsx(AccordionDetails, { children: _jsxs(SimpleGrid, { container: true, columns: 2, children: [_jsxs(SimpleGrid, { item: true, xs: 12, sm: 6, children: [_jsx(Text, { variant: "subtitle2", children: "Summary" }), _jsxs(List, { dense: true, children: [_jsx(ListItem, { children: _jsx(ListItem, { primary: "Total Messages", secondary: conversation.summary.totalMessages }) }), _jsx(ListItem, { children: _jsx(ListItem, { primary: "Average Latency", secondary: formatLatency(conversation.summary.avgLatency) }) }), _jsx(ListItem, { children: _jsx(ListItem, { primary: "Error Count", secondary: conversation.summary.errorCount }) })] })] }), _jsxs(SimpleGrid, { item: true, xs: 12, sm: 6, children: [_jsx(Text, { variant: "subtitle2", children: "Timeline" }), _jsx(Box, { sx: { height: 200 }, children: _jsx(Text, { variant: "body2", color: "textSecondary", children: "Conversation flow visualization would go here" }) })] })] }) })] }, conversation.id)); })] })), activeTab === 2 && (_jsx(Box, { children: _jsx(SimpleGrid, { container: true, columns: 3, children: agents.map(function (agent) { return (_jsx(SimpleGrid, { item: true, xs: 12, sm: 6, md: 4, children: _jsx(Card, { children: _jsxs(CardBody, { children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', mb: 2 }, children: [_jsx(Badge, { color: agent.status === 'online' ? 'success' : 'error', variant: "dot", children: _jsx(AgentIcon, {}) }), _jsx(Text, { variant: "h6", sx: { ml: 1 }, children: agent.name })] }), _jsxs(Text, { variant: "body2", color: "textSecondary", sx: { mb: 2 }, children: ["Type: ", agent.type] }), _jsx(Text, { variant: "subtitle2", sx: { mb: 1 }, children: "Message Statistics" }), _jsxs(SimpleGrid, { container: true, columns: 1, sx: { mb: 2 }, children: [_jsx(SimpleGrid, { item: true, xs: 6, children: _jsxs(Text, { variant: "body2", children: ["Sent: ", agent.messageStats.sent] }) }), _jsx(SimpleGrid, { item: true, xs: 6, children: _jsxs(Text, { variant: "body2", children: ["Received: ", agent.messageStats.received] }) }), _jsx(SimpleGrid, { item: true, xs: 6, children: _jsxs(Text, { variant: "body2", children: ["Processed: ", agent.messageStats.processed] }) }), _jsx(SimpleGrid, { item: true, xs: 6, children: _jsxs(Text, { variant: "body2", children: ["Failed: ", agent.messageStats.failed] }) })] }), _jsx(Text, { variant: "subtitle2", sx: { mb: 1 }, children: "Performance" }), _jsxs(Text, { variant: "body2", children: ["Response Time: ", formatLatency(agent.performanceMetrics.avgResponseTime)] }), _jsxs(Text, { variant: "body2", children: ["Reliability: ", (agent.performanceMetrics.reliability * 100).toFixed(1), "%"] }), _jsxs(Text, { variant: "body2", children: ["Error Rate: ", agent.performanceMetrics.errorRate.toFixed(1), "%"] })] }) }) }, agent.id)); }) }) })), activeTab === 3 && (_jsx(Box, { children: _jsxs(SimpleGrid, { container: true, columns: 3, children: [_jsx(SimpleGrid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardBody, { children: [_jsx(Text, { variant: "h6", sx: { mb: 2 }, children: "Message Latency Trends" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: prepareLatencyChart(), children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "index" }), _jsx(YAxis, {}), _jsx(RechartsTooltip, {}), _jsx(Line, { type: "monotone", dataKey: "latency", stroke: "#8884d8", strokeWidth: 2 })] }) })] }) }) }), _jsx(SimpleGrid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardBody, { children: [_jsx(Text, { variant: "h6", sx: { mb: 2 }, children: "Message Types Distribution" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: prepareMessageTypeChart(), children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "messageType" }), _jsx(YAxis, {}), _jsx(RechartsTooltip, {}), _jsx(Bar, { dataKey: "count", fill: "#8884d8" })] }) })] }) }) }), _jsx(SimpleGrid, { item: true, xs: 12, children: _jsx(Card, { children: _jsxs(CardBody, { children: [_jsx(Text, { variant: "h6", sx: { mb: 2 }, children: "Error Analysis" }), _jsx(TableContainer, { children: _jsxs(Table, { children: [_jsx(Thead, { children: _jsxs(Tr, { children: [_jsx(Td, { children: "Error Type" }), _jsx(Td, { children: "Count" }), _jsx(Td, { children: "Last Occurrence" }), _jsx(Td, { children: "Affected Agents" })] }) }), _jsx(Tbody, { children: _jsx(Tr, { children: _jsx(Td, { colSpan: 4, align: "center", children: _jsx(Text, { variant: "body2", color: "textSecondary", children: "No errors detected in current session" }) }) }) })] }) })] }) }) })] }) }))] })] }), _jsxs(Modal, { open: createSessionDialog, onClose: function () { return setCreateSessionDialog(false); }, maxWidth: "sm", fullWidth: true, children: [_jsx(ModalHeader, { children: "Create New Debug Session" }), _jsxs(ModalBody, { children: [_jsx(Input, { fullWidth: true, label: "Session Name", value: newSessionName, onChange: function (e) { return setNewSessionName(e.target.value); }, margin: "normal" }), _jsx(Input, { fullWidth: true, label: "Description", value: newSessionDescription, onChange: function (e) { return setNewSessionDescription(e.target.value); }, margin: "normal", multiline: true, rows: 3 })] }), _jsxs(ModalFooter, { children: [_jsx(Button, { onClick: function () { return setCreateSessionDialog(false); }, children: "Cancel" }), _jsx(Button, { onClick: createDebugSession, variant: "contained", disabled: !newSessionName, children: "Create Session" })] })] }), selectedMessage && (_jsxs(Modal, { open: Boolean(selectedMessage), onClose: function () { return setSelectedMessage(null); }, maxWidth: "md", fullWidth: true, children: [_jsxs(ModalHeader, { children: ["Message Details", _jsx(IconButton, { onClick: function () { return setSelectedMessage(null); }, sx: { position: 'absolute', right: 8, top: 8 }, children: _jsx(CloseIcon, {}) })] }), _jsxs(ModalBody, { children: [_jsxs(Text, { variant: "subtitle1", sx: { mb: 2 }, children: ["Message ID: ", selectedMessage.messageId] }), _jsxs(SimpleGrid, { container: true, columns: 2, children: [_jsxs(SimpleGrid, { item: true, xs: 12, sm: 6, children: [_jsx(Text, { variant: "subtitle2", children: "Basic Information" }), _jsxs(Text, { variant: "body2", children: ["From: ", selectedMessage.fromAgent] }), _jsxs(Text, { variant: "body2", children: ["To: ", selectedMessage.toAgent] }), _jsxs(Text, { variant: "body2", children: ["Type: ", selectedMessage.messageType] }), _jsxs(Text, { variant: "body2", children: ["Priority: ", selectedMessage.priority] }), _jsxs(Text, { variant: "body2", children: ["Status: ", selectedMessage.status] })] }), _jsxs(SimpleGrid, { item: true, xs: 12, sm: 6, children: [_jsx(Text, { variant: "subtitle2", children: "Performance Metrics" }), _jsxs(Text, { variant: "body2", children: ["Send Time: ", formatTimestamp(selectedMessage.performanceMetrics.sendTime)] }), _jsxs(Text, { variant: "body2", children: ["Total Latency: ", formatLatency(selectedMessage.performanceMetrics.totalLatency)] }), _jsxs(Text, { variant: "body2", children: ["Processing Time: ", formatLatency(selectedMessage.performanceMetrics.processTime)] }), _jsxs(Text, { variant: "body2", children: ["Bandwidth: ", selectedMessage.performanceMetrics.bandwidth, " bytes"] })] }), _jsxs(SimpleGrid, { item: true, xs: 12, children: [_jsx(Text, { variant: "subtitle2", children: "Payload" }), _jsx(Box, { sx: { p: 2, bgcolor: 'grey.50', maxHeight: 200, overflow: 'auto' }, children: _jsx("pre", { style: { margin: 0, fontSize: '0.8rem' }, children: JSON.stringify(selectedMessage.payload, null, 2) }) })] }), selectedMessage.metadata.errors.length > 0 && (_jsxs(SimpleGrid, { item: true, xs: 12, children: [_jsx(Text, { variant: "subtitle2", children: "Errors" }), selectedMessage.metadata.errors.map(function (error, index) { return (_jsx(Alert, { severity: "error", sx: { mt: 1 }, children: error }, index)); })] }))] })] })] }))] }));
};
export default A2ADebugger;
