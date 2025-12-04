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
import { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';
import { format } from 'date-fns';
import axios from 'axios';
var ModerationDashboard = function () {
    var _a;
    var _b = useState(0), activeTab = _b[0], setActiveTab = _b[1];
    var _c = useState([]), recentActions = _c[0], setRecentActions = _c[1];
    var _d = useState([]), rules = _d[0], setRules = _d[1];
    var _e = useState(null), stats = _e[0], setStats = _e[1];
    var _f = useState(null), selectedRule = _f[0], setSelectedRule = _f[1];
    var _g = useState(false), isRuleDialogOpen = _g[0], setIsRuleDialogOpen = _g[1];
    var _h = useState([]), actionTrends = _h[0], setActionTrends = _h[1];
    useEffect(function () {
        fetchDashboardData();
    }, []);
    var fetchDashboardData = function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, actionsRes, rulesRes, statsRes, trendsRes, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, Promise.all([
                            axios.get('/api/moderation/actions'),
                            axios.get('/api/moderation/rules'),
                            axios.get('/api/moderation/stats'),
                            axios.get('/api/moderation/trends')
                        ])];
                case 1:
                    _a = _b.sent(), actionsRes = _a[0], rulesRes = _a[1], statsRes = _a[2], trendsRes = _a[3];
                    setRecentActions(actionsRes.data);
                    setRules(rulesRes.data);
                    setStats(statsRes.data);
                    setActionTrends(trendsRes.data);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _b.sent();
                    console.error('Error fetching dashboard data:', error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var handleTabChange = function (_event, newValue) {
        setActiveTab(newValue);
    };
    var handleRuleEdit = function (rule) {
        setSelectedRule(rule);
        setIsRuleDialogOpen(true);
    };
    var handleRuleSave = function (rule) { return __awaiter(void 0, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    if (!rule.id) return [3 /*break*/, 2];
                    return [4 /*yield*/, axios.put("/api/moderation/rules/".concat(rule.id), rule)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, axios.post('/api/moderation/rules', rule)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    fetchDashboardData();
                    setIsRuleDialogOpen(false);
                    return [3 /*break*/, 6];
                case 5:
                    error_2 = _a.sent();
                    console.error('Error saving rule:', error_2);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var renderOverview = function () { return (_jsxs(SimpleGrid, { container: true, columns: 3, children: [_jsx(SimpleGrid, { item: true, xs: 12, md: 8, children: _jsxs(Box, { sx: { p: 2, height: '400px' }, children: [_jsx(Text, { variant: "h6", gutterBottom: true, children: "Moderation Actions Trend" }), _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: actionTrends, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "date" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Line, { type: "monotone", dataKey: "warns", stroke: "#ffc107" }), _jsx(Line, { type: "monotone", dataKey: "mutes", stroke: "#ff9800" }), _jsx(Line, { type: "monotone", dataKey: "bans", stroke: "#f44336" }), _jsx(Line, { type: "monotone", dataKey: "deletes", stroke: "#9c27b0" })] }) })] }) }), _jsx(SimpleGrid, { item: true, xs: 12, md: 4, children: _jsxs(SimpleGrid, { container: true, columns: 2, children: [_jsx(SimpleGrid, { item: true, xs: 6, children: _jsx(Card, { children: _jsxs(CardBody, { children: [_jsx(Text, { color: "textSecondary", gutterBottom: true, children: "Total Actions" }), _jsx(Text, { variant: "h4", children: (stats === null || stats === void 0 ? void 0 : stats.totalActions) || 0 })] }) }) }), _jsx(SimpleGrid, { item: true, xs: 6, children: _jsx(Card, { children: _jsxs(CardBody, { children: [_jsx(Text, { color: "textSecondary", gutterBottom: true, children: "Active Rules" }), _jsx(Text, { variant: "h4", children: (stats === null || stats === void 0 ? void 0 : stats.activeRules) || 0 })] }) }) }), _jsx(SimpleGrid, { item: true, xs: 6, children: _jsx(Card, { children: _jsxs(CardBody, { children: [_jsx(Text, { color: "textSecondary", gutterBottom: true, children: "Banned Users" }), _jsx(Text, { variant: "h4", children: (stats === null || stats === void 0 ? void 0 : stats.bannedUsers) || 0 })] }) }) }), _jsx(SimpleGrid, { item: true, xs: 6, children: _jsx(Card, { children: _jsxs(CardBody, { children: [_jsx(Text, { color: "textSecondary", gutterBottom: true, children: "Muted Users" }), _jsx(Text, { variant: "h4", children: (stats === null || stats === void 0 ? void 0 : stats.mutedUsers) || 0 })] }) }) })] }) })] })); };
    var renderRecentActions = function () { return (_jsx(List, { children: recentActions.map(function (action) { return (_jsx(ListItem, { secondaryAction: _jsx(IconButton, { edge: "end", "aria-label": "delete", children: _jsx(Delete, {}) }), children: _jsx(ListItem, { primary: _jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [action.type === 'ban' && _jsx(Block, { color: "error" }), action.type === 'mute' && _jsx(VolumeOff, { color: "warning" }), action.type === 'warn' && _jsx(Warning, { color: "info" }), _jsx(Text, { children: "".concat(action.type.toUpperCase(), " - User: ").concat(action.userId) })] }), secondary: _jsxs(Box, { children: [_jsx(Text, { variant: "body2", color: "text.secondary", children: "Reason: ".concat(action.reason) }), _jsx(Text, { variant: "caption", color: "text.secondary", children: "By: ".concat(action.moderatorId, " at ").concat(format(new Date(action.timestamp), 'PPpp')) })] }) }) }, action.id)); }) })); };
    var renderRules = function () { return (_jsxs(Box, { children: [_jsx(Box, { display: "flex", justifyContent: "flex-end", mb: 2, children: _jsx(Button, { variant: "contained", startIcon: _jsx(Add, {}), onClick: function () {
                        setSelectedRule(null);
                        setIsRuleDialogOpen(true);
                    }, children: "Add Rule" }) }), _jsx(List, { children: rules.map(function (rule) { return (_jsx(ListItem, { secondaryAction: _jsx(IconButton, { edge: "end", onClick: function () { return handleRuleEdit(rule); }, children: _jsx(Edit, {}) }), children: _jsx(ListItem, { primary: _jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx(Text, { children: rule.type }), _jsx(Tag, { size: "small", label: rule.action, color: rule.action === 'ban'
                                        ? 'error'
                                        : rule.action === 'mute'
                                            ? 'warning'
                                            : 'default' }), _jsx(Tag, { size: "small", label: rule.isActive ? 'Active' : 'Inactive', color: rule.isActive ? 'success' : 'default' })] }), secondary: _jsxs(Box, { children: [rule.pattern && (_jsxs(Text, { variant: "body2", children: ["Pattern: ", rule.pattern] })), rule.keywords && (_jsxs(Text, { variant: "body2", children: ["Keywords: ", rule.keywords.join(', ')] })), _jsxs(Text, { variant: "body2", children: ["Threshold: ", rule.threshold] })] }) }) }, rule.id)); }) })] })); };
    return (_jsxs(Box, { sx: { p: 3 }, children: [_jsx(Text, { variant: "h4", gutterBottom: true, children: "Moderation Dashboard" }), _jsx(Box, { sx: { borderBottom: 1, borderColor: 'divider', mb: 3 }, children: _jsxs(Tabs, { value: activeTab, onChange: handleTabChange, children: [_jsx(Tab, { label: "Overview" }), _jsx(Tab, { label: "Recent Actions" }), _jsx(Tab, { label: "Rules" })] }) }), activeTab === 0 && renderOverview(), activeTab === 1 && renderRecentActions(), activeTab === 2 && renderRules(), _jsxs(Modal, { open: isRuleDialogOpen, onClose: function () { return setIsRuleDialogOpen(false); }, maxWidth: "sm", fullWidth: true, children: [_jsx(ModalHeader, { children: selectedRule ? 'Edit Rule' : 'Create Rule' }), _jsx(ModalBody, { children: _jsxs(Box, { component: "form", sx: { mt: 2 }, children: [_jsxs(FormControl, { fullWidth: true, sx: { mb: 2 }, children: [_jsx(InputLabel, { children: "Type" }), _jsxs(Select, { value: (selectedRule === null || selectedRule === void 0 ? void 0 : selectedRule.type) || '', label: "Type", onChange: function (e) {
                                                return setSelectedRule(function (prev) {
                                                    return prev ? __assign(__assign({}, prev), { type: e.target.value }) : null;
                                                });
                                            }, children: [_jsx(Option, { value: "spam", children: "Spam" }), _jsx(Option, { value: "profanity", children: "Profanity" }), _jsx(Option, { value: "harassment", children: "Harassment" }), _jsx(Option, { value: "custom", children: "Custom" })] })] }), _jsx(Input, { fullWidth: true, label: "Pattern", sx: { mb: 2 }, value: (selectedRule === null || selectedRule === void 0 ? void 0 : selectedRule.pattern) || '', onChange: function (e) {
                                        return setSelectedRule(function (prev) {
                                            return prev ? __assign(__assign({}, prev), { pattern: e.target.value }) : null;
                                        });
                                    } }), _jsx(Input, { fullWidth: true, label: "Keywords (comma-separated)", sx: { mb: 2 }, value: ((_a = selectedRule === null || selectedRule === void 0 ? void 0 : selectedRule.keywords) === null || _a === void 0 ? void 0 : _a.join(', ')) || '', onChange: function (e) {
                                        return setSelectedRule(function (prev) {
                                            return prev
                                                ? __assign(__assign({}, prev), { keywords: e.target.value
                                                        .split(',')
                                                        .map(function (k) { return k.trim(); }) }) : null;
                                        });
                                    } }), _jsxs(FormControl, { fullWidth: true, sx: { mb: 2 }, children: [_jsx(InputLabel, { children: "Action" }), _jsxs(Select, { value: (selectedRule === null || selectedRule === void 0 ? void 0 : selectedRule.action) || '', label: "Action", onChange: function (e) {
                                                return setSelectedRule(function (prev) {
                                                    return prev ? __assign(__assign({}, prev), { action: e.target.value }) : null;
                                                });
                                            }, children: [_jsx(Option, { value: "warn", children: "Warn" }), _jsx(Option, { value: "delete", children: "Delete" }), _jsx(Option, { value: "mute", children: "Mute" }), _jsx(Option, { value: "ban", children: "Ban" })] })] })] }) }), _jsxs(ModalFooter, { children: [_jsx(Button, { onClick: function () { return setIsRuleDialogOpen(false); }, children: "Cancel" }), _jsx(Button, { onClick: function () { return selectedRule && handleRuleSave(selectedRule); }, variant: "contained", children: "Save" })] })] })] }));
};
export default ModerationDashboard;
