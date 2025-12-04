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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Users, Eye, Lock, Unlock } from 'lucide-react';
var WorkspaceManagement = function () {
    var _a = useState([]), workspaces = _a[0], setWorkspaces = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    var _c = useState(''), searchTerm = _c[0], setSearchTerm = _c[1];
    var _d = useState('all'), statusFilter = _d[0], setStatusFilter = _d[1];
    var _e = useState('all'), planFilter = _e[0], setPlanFilter = _e[1];
    var _f = useState(null), selectedWorkspace = _f[0], setSelectedWorkspace = _f[1];
    var _g = useState(false), showCreateDialog = _g[0], setShowCreateDialog = _g[1];
    useEffect(function () {
        fetchWorkspaces();
    }, []);
    var fetchWorkspaces = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, 6, 7]);
                    setLoading(true);
                    return [4 /*yield*/, fetch('/api/admin/workspaces')];
                case 1:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setWorkspaces(data);
                    return [3 /*break*/, 4];
                case 3:
                    // Mock data for development
                    setWorkspaces([
                        {
                            id: '1',
                            name: 'Acme Corporation',
                            description: 'Main workspace for Acme Corp operations',
                            owner: {
                                id: '1',
                                name: 'John Doe',
                                email: 'john@acme.com'
                            },
                            members: 25,
                            status: 'active',
                            plan: 'enterprise',
                            createdAt: '2024-01-15T10:00:00Z',
                            lastActivity: '2024-01-20T14:30:00Z',
                            storage: {
                                used: 2.5,
                                limit: 10
                            },
                            agents: 12,
                            workflows: 8
                        },
                        {
                            id: '2',
                            name: 'StartupXYZ',
                            description: 'Innovative startup workspace',
                            owner: {
                                id: '2',
                                name: 'Jane Smith',
                                email: 'jane@startupxyz.com'
                            },
                            members: 8,
                            status: 'active',
                            plan: 'pro',
                            createdAt: '2024-01-10T09:00:00Z',
                            lastActivity: '2024-01-20T16:45:00Z',
                            storage: {
                                used: 1.2,
                                limit: 5
                            },
                            agents: 5,
                            workflows: 3
                        },
                        {
                            id: '3',
                            name: 'Freelancer Hub',
                            description: 'Personal workspace for freelance projects',
                            owner: {
                                id: '3',
                                name: 'Mike Johnson',
                                email: 'mike@freelancer.com'
                            },
                            members: 1,
                            status: 'inactive',
                            plan: 'free',
                            createdAt: '2024-01-05T12:00:00Z',
                            lastActivity: '2024-01-18T10:15:00Z',
                            storage: {
                                used: 0.3,
                                limit: 1
                            },
                            agents: 2,
                            workflows: 1
                        }
                    ]);
                    _a.label = 4;
                case 4: return [3 /*break*/, 7];
                case 5:
                    error_1 = _a.sent();
                    console.error('Failed to fetch workspaces:', error_1);
                    return [3 /*break*/, 7];
                case 6:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var filteredWorkspaces = workspaces.filter(function (workspace) {
        var matchesSearch = workspace.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            workspace.owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            workspace.owner.email.toLowerCase().includes(searchTerm.toLowerCase());
        var matchesStatus = statusFilter === 'all' || workspace.status === statusFilter;
        var matchesPlan = planFilter === 'all' || workspace.plan === planFilter;
        return matchesSearch && matchesStatus && matchesPlan;
    });
    var getStatusBadge = function (status) {
        var variants = {
            active: 'default',
            inactive: 'secondary',
            suspended: 'destructive'
        };
        return _jsx(Badge, { variant: variants[status], children: status });
    };
    var getPlanBadge = function (plan) {
        var variants = {
            free: 'outline',
            pro: 'default',
            enterprise: 'secondary'
        };
        return _jsx(Badge, { variant: variants[plan], children: plan });
    };
    var formatDate = function (dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    var formatStorage = function (used, limit) {
        return "".concat(used.toFixed(1), " GB / ").concat(limit, " GB");
    };
    var getStoragePercentage = function (used, limit) {
        return (used / limit) * 100;
    };
    var suspendWorkspace = function (workspaceId) { return __awaiter(void 0, void 0, void 0, function () {
        var response, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch("/api/admin/workspaces/".concat(workspaceId, "/suspend"), {
                            method: 'POST'
                        })];
                case 1:
                    response = _a.sent();
                    if (response.ok) {
                        fetchWorkspaces();
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    console.error('Failed to suspend workspace:', error_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var activateWorkspace = function (workspaceId) { return __awaiter(void 0, void 0, void 0, function () {
        var response, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch("/api/admin/workspaces/".concat(workspaceId, "/activate"), {
                            method: 'POST'
                        })];
                case 1:
                    response = _a.sent();
                    if (response.ok) {
                        fetchWorkspaces();
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.error('Failed to activate workspace:', error_3);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs("div", { className: "p-6 max-w-7xl mx-auto space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Workspace Management" }), _jsx("p", { className: "text-gray-600 mt-2", children: "Manage and monitor all workspaces in the system" })] }), _jsxs(Button, { onClick: function () { return setShowCreateDialog(true); }, children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Create Workspace"] })] }), _jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex flex-wrap gap-4 items-center", children: [_jsx("div", { className: "flex-1 min-w-[200px]", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx(Input, { placeholder: "Search workspaces...", value: searchTerm, onChange: function (e) { return setSearchTerm(e.target.value); }, className: "pl-10" })] }) }), _jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [_jsx(SelectTrigger, { className: "w-[150px]", title: "Filter by status", children: _jsx(SelectValue, { placeholder: "Status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Status" }), _jsx(SelectItem, { value: "active", children: "Active" }), _jsx(SelectItem, { value: "inactive", children: "Inactive" }), _jsx(SelectItem, { value: "suspended", children: "Suspended" })] })] }), _jsxs(Select, { value: planFilter, onValueChange: setPlanFilter, children: [_jsx(SelectTrigger, { className: "w-[150px]", title: "Filter by plan", children: _jsx(SelectValue, { placeholder: "Plan" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Plans" }), _jsx(SelectItem, { value: "free", children: "Free" }), _jsx(SelectItem, { value: "pro", children: "Pro" }), _jsx(SelectItem, { value: "enterprise", children: "Enterprise" })] })] })] }) }) }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: loading ? (Array.from({ length: 6 }).map(function (_, i) { return (_jsx(Card, { className: "animate-pulse", children: _jsxs(CardContent, { className: "p-6", children: [_jsx("div", { className: "h-4 bg-gray-200 rounded mb-4" }), _jsx("div", { className: "h-3 bg-gray-200 rounded mb-2" }), _jsx("div", { className: "h-3 bg-gray-200 rounded mb-4" }), _jsxs("div", { className: "flex justify-between", children: [_jsx("div", { className: "h-6 bg-gray-200 rounded w-16" }), _jsx("div", { className: "h-6 bg-gray-200 rounded w-12" })] })] }) }, i)); })) : (filteredWorkspaces.map(function (workspace) { return (_jsxs(Card, { className: "hover:shadow-lg transition-shadow", children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx(CardTitle, { className: "text-lg", children: workspace.name }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: workspace.description })] }), _jsxs("div", { className: "flex gap-1", children: [getStatusBadge(workspace.status), getPlanBadge(workspace.plan)] })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-600", children: [_jsx(Users, { className: "w-4 h-4" }), _jsxs("span", { children: ["Owner: ", workspace.owner.name] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Members:" }), _jsx("span", { className: "ml-1 font-medium", children: workspace.members })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Agents:" }), _jsx("span", { className: "ml-1 font-medium", children: workspace.agents })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Workflows:" }), _jsx("span", { className: "ml-1 font-medium", children: workspace.workflows })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Created:" }), _jsx("span", { className: "ml-1 font-medium", children: formatDate(workspace.createdAt) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-600", children: "Storage:" }), _jsx("span", { className: "font-medium", children: formatStorage(workspace.storage.used, workspace.storage.limit) })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-blue-600 h-2 rounded-full", style: { width: "".concat(Math.min(getStoragePercentage(workspace.storage.used, workspace.storage.limit), 100), "%") } }) })] }), _jsxs("div", { className: "flex gap-2 pt-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: function () { return setSelectedWorkspace(workspace); }, children: [_jsx(Eye, { className: "w-4 h-4 mr-1" }), "View"] }), workspace.status === 'active' ? (_jsxs(Button, { variant: "outline", size: "sm", onClick: function () { return suspendWorkspace(workspace.id); }, children: [_jsx(Lock, { className: "w-4 h-4 mr-1" }), "Suspend"] })) : (_jsxs(Button, { variant: "outline", size: "sm", onClick: function () { return activateWorkspace(workspace.id); }, children: [_jsx(Unlock, { className: "w-4 h-4 mr-1" }), "Activate"] }))] })] })] }, workspace.id)); })) }), selectedWorkspace && (_jsx(Dialog, { open: !!selectedWorkspace, onOpenChange: function () { return setSelectedWorkspace(null); }, children: _jsxs(DialogContent, { className: "max-w-4xl max-h-[80vh] overflow-y-auto", children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { className: "flex items-center gap-2", children: [selectedWorkspace.name, getStatusBadge(selectedWorkspace.status), getPlanBadge(selectedWorkspace.plan)] }) }), _jsxs(Tabs, { defaultValue: "overview", className: "mt-4", children: [_jsxs(TabsList, { children: [_jsx(TabsTrigger, { value: "overview", children: "Overview" }), _jsx(TabsTrigger, { value: "members", children: "Members" }), _jsx(TabsTrigger, { value: "activity", children: "Activity" }), _jsx(TabsTrigger, { value: "settings", children: "Settings" })] }), _jsx(TabsContent, { value: "overview", className: "space-y-4", children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "Workspace Info" }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { children: [_jsx(Label, { children: "Description" }), _jsx("p", { className: "text-sm text-gray-600", children: selectedWorkspace.description })] }), _jsxs("div", { children: [_jsx(Label, { children: "Owner" }), _jsxs("p", { className: "text-sm", children: [selectedWorkspace.owner.name, " (", selectedWorkspace.owner.email, ")"] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Created" }), _jsx("p", { className: "text-sm", children: formatDate(selectedWorkspace.createdAt) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Last Activity" }), _jsx("p", { className: "text-sm", children: formatDate(selectedWorkspace.lastActivity) })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "Usage Statistics" }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Members:" }), _jsx("span", { className: "font-medium", children: selectedWorkspace.members })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Agents:" }), _jsx("span", { className: "font-medium", children: selectedWorkspace.agents })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Workflows:" }), _jsx("span", { className: "font-medium", children: selectedWorkspace.workflows })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between mb-1", children: [_jsx("span", { children: "Storage:" }), _jsx("span", { className: "font-medium", children: formatStorage(selectedWorkspace.storage.used, selectedWorkspace.storage.limit) })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-blue-600 h-2 rounded-full", style: { width: "".concat(Math.min(getStoragePercentage(selectedWorkspace.storage.used, selectedWorkspace.storage.limit), 100), "%") } }) })] })] })] })] }) }), _jsx(TabsContent, { value: "members", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Workspace Members" }) }), _jsx(CardContent, { children: _jsx("p", { className: "text-gray-600", children: "Member management functionality would be implemented here." }) })] }) }), _jsx(TabsContent, { value: "activity", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Recent Activity" }) }), _jsx(CardContent, { children: _jsx("p", { className: "text-gray-600", children: "Activity logs and analytics would be displayed here." }) })] }) }), _jsx(TabsContent, { value: "settings", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Workspace Settings" }) }), _jsx(CardContent, { children: _jsx("p", { className: "text-gray-600", children: "Workspace configuration options would be available here." }) })] }) })] })] }) })), _jsx(Dialog, { open: showCreateDialog, onOpenChange: setShowCreateDialog, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Create New Workspace" }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "workspace-name", children: "Workspace Name" }), _jsx(Input, { id: "workspace-name", placeholder: "Enter workspace name" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "workspace-description", children: "Description" }), _jsx(Input, { id: "workspace-description", placeholder: "Enter workspace description" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "workspace-plan", children: "Plan" }), _jsxs(Select, { children: [_jsx(SelectTrigger, { id: "workspace-plan", children: _jsx(SelectValue, { placeholder: "Select plan" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "free", children: "Free" }), _jsx(SelectItem, { value: "pro", children: "Pro" }), _jsx(SelectItem, { value: "enterprise", children: "Enterprise" })] })] })] }), _jsxs("div", { className: "flex gap-2 pt-4", children: [_jsx(Button, { className: "flex-1", children: "Create Workspace" }), _jsx(Button, { variant: "outline", onClick: function () { return setShowCreateDialog(false); }, children: "Cancel" })] })] })] }) })] }));
};
export default WorkspaceManagement;
