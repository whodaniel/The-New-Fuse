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
import { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { Card, CardHeader, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Alert } from './ui/alert';
import { Tooltip } from './ui/tooltip';
import { useSession } from '@your-org/security/react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
export function ConnectionManager() {
    var _this = this;
    var _a = useState([]), connections = _a[0], setConnections = _a[1];
    var _b = useState(null), selectedConnection = _b[0], setSelectedConnection = _b[1];
    var _c = useState('all'), statusFilter = _c[0], setStatusFilter = _c[1];
    var _d = useState('all'), typeFilter = _d[0], setTypeFilter = _d[1];
    var _e = useState(new Set()), selectedConnections = _e[0], setSelectedConnections = _e[1];
    var _f = useState(false), showDisconnectDialog = _f[0], setShowDisconnectDialog = _f[1];
    var session = useSession().session;
    var _g = useWebSocket(), subscribe = _g.subscribe, send = _g.send;
    useEffect(function () {
        var unsubscribe = subscribe('connections_update', function (data) {
            setConnections(data);
        });
        send('get_connections');
        return function () {
            unsubscribe();
        };
    }, [subscribe, send]);
    var handleDisconnect = function (connectionId) { return __awaiter(_this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, send('terminate_connection', { connectionId: connectionId })];
                case 1:
                    _a.sent();
                    setSelectedConnection(null);
                    setSelectedConnections(new Set());
                    setShowDisconnectDialog(false);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error('Failed to terminate connection:', error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var handleBatchDisconnect = function () { return __awaiter(_this, void 0, void 0, function () {
        var promises, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    promises = Array.from(selectedConnections).map(function (id) {
                        return send('terminate_connection', { connectionId: id });
                    });
                    return [4 /*yield*/, Promise.all(promises)];
                case 1:
                    _a.sent();
                    setSelectedConnections(new Set());
                    setShowDisconnectDialog(false);
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    console.error('Failed to terminate connections:', error_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var handleReconnect = function (connectionId) { return __awaiter(_this, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, send('reconnect', { connectionId: connectionId })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.error('Failed to reconnect:', error_3);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var getStatusColor = function (status) {
        switch (status) {
            case 'active':
                return 'bg-green-500';
            case 'idle':
                return 'bg-yellow-500';
            case 'disconnected':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };
    var toggleConnectionSelection = function (connectionId) {
        setSelectedConnections(function (prev) {
            var newSet = new Set(prev);
            if (newSet.has(connectionId)) {
                newSet.delete(connectionId);
            }
            else {
                newSet.add(connectionId);
            }
            return newSet;
        });
    };
    var filteredConnections = connections.filter(function (connection) {
        var matchesStatus = statusFilter === 'all' || connection.status === statusFilter;
        var matchesType = typeFilter === 'all' || connection.type === typeFilter;
        return matchesStatus && matchesType;
    });
    var connectionTypes = Array.from(new Set(connections.map(function (c) { return c.type; })));
    if (!session) {
        return (_jsx(Alert, { variant: "warning", children: "Please log in to manage connections" }));
    }
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Connection Manager" }), _jsxs("div", { className: "flex space-x-4", children: [_jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [_jsx(SelectTrigger, { className: "w-[150px]", children: _jsx(SelectValue, { placeholder: "Filter by status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Statuses" }), _jsx(SelectItem, { value: "active", children: "Active" }), _jsx(SelectItem, { value: "idle", children: "Idle" }), _jsx(SelectItem, { value: "disconnected", children: "Disconnected" })] })] }), _jsxs(Select, { value: typeFilter, onValueChange: setTypeFilter, children: [_jsx(SelectTrigger, { className: "w-[150px]", children: _jsx(SelectValue, { placeholder: "Filter by type" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Types" }), connectionTypes.map(function (type) { return (_jsx(SelectItem, { value: type, children: type }, type)); })] })] }), selectedConnections.size > 0 && (_jsxs(Button, { variant: "destructive", onClick: function () { return setShowDisconnectDialog(true); }, children: ["Disconnect Selected (", selectedConnections.size, ")"] }))] })] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [filteredConnections.map(function (connection) { return (_jsxs("div", { className: "p-4 border rounded-lg ".concat(selectedConnection === connection.id ? 'border-blue-500' : '', " ").concat(selectedConnections.has(connection.id) ? 'bg-blue-50' : ''), children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("input", { "aria-label": "Select connection", type: "checkbox", checked: selectedConnections.has(connection.id), onChange: function () { return toggleConnectionSelection(connection.id); }, className: "h-4 w-4 rounded border-gray-300" }), _jsx("div", { className: "w-3 h-3 rounded-full ".concat(getStatusColor(connection.status)) }), _jsxs("div", { children: [_jsx("span", { className: "font-medium", children: connection.type }), _jsxs("div", { className: "flex items-center space-x-2 mt-1", children: [_jsx(Badge, { variant: "secondary", children: connection.status }), _jsxs("span", { className: "text-sm text-gray-500", children: ["Last activity: ", format(new Date(connection.lastActivity), 'PPpp')] })] })] })] }), _jsxs("div", { className: "space-x-2", children: [connection.status === 'disconnected' ? (_jsx(Tooltip, { content: "Attempt to reconnect", children: _jsx(Button, { size: "sm", variant: "outline", onClick: function () { return handleReconnect(connection.id); }, children: "Reconnect" }) })) : (_jsx(Tooltip, { content: "Force disconnect", children: _jsx(Button, { size: "sm", variant: "destructive", onClick: function () { return setShowDisconnectDialog(true); }, children: "Disconnect" }) })), _jsx(Button, { size: "sm", variant: "outline", onClick: function () { return setSelectedConnection(connection.id === selectedConnection ? null : connection.id); }, children: connection.id === selectedConnection ? 'Hide Details' : 'Show Details' })] })] }), selectedConnection === connection.id && (_jsx("div", { className: "mt-4 bg-gray-50 p-4 rounded", children: _jsx("pre", { className: "text-xs overflow-x-auto", children: JSON.stringify(connection.metadata, null, 2) }) }))] }, connection.id)); }), filteredConnections.length === 0 && (_jsx("div", { className: "text-center text-gray-500 py-8", children: connections.length === 0 ? 'No active connections' : 'No connections match the current filters' }))] }) }), _jsx(Dialog, { open: showDisconnectDialog, onOpenChange: setShowDisconnectDialog, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Confirm Disconnect" }), _jsxs(DialogDescription, { children: ["Are you sure you want to disconnect ", selectedConnections.size > 0
                                            ? "".concat(selectedConnections.size, " selected connections")
                                            : 'this connection', "?"] })] }), _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx(Button, { variant: "outline", onClick: function () { return setShowDisconnectDialog(false); }, children: "Cancel" }), _jsx(Button, { variant: "destructive", onClick: function () { return selectedConnections.size > 0
                                        ? handleBatchDisconnect()
                                        : handleDisconnect(selectedConnection); }, children: "Disconnect" })] })] }) })] }));
}
