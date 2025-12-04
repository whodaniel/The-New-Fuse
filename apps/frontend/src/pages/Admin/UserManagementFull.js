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
import { Users, Search, Plus, Edit, Trash2, Shield, Check, Lock, Unlock, Download, Upload, RefreshCw, UserX, Eye, } from 'lucide-react';
export default function UserManagementFull() {
    var _this = this;
    var _a = useState([]), users = _a[0], setUsers = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    var _c = useState(''), searchTerm = _c[0], setSearchTerm = _c[1];
    var _d = useState('all'), selectedRole = _d[0], setSelectedRole = _d[1];
    var _e = useState('all'), selectedStatus = _e[0], setSelectedStatus = _e[1];
    var _f = useState(new Set()), selectedUsers = _f[0], setSelectedUsers = _f[1];
    var _g = useState(false), showCreateModal = _g[0], setShowCreateModal = _g[1];
    var _h = useState(false), showEditModal = _h[0], setShowEditModal = _h[1];
    var _j = useState(null), selectedUser = _j[0], setSelectedUser = _j[1];
    useEffect(function () {
        loadUsers();
    }, []);
    var loadUsers = function () { return __awaiter(_this, void 0, void 0, function () {
        var mockUsers, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    // Mock data - replace with API call
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 2:
                    // Mock data - replace with API call
                    _a.sent();
                    mockUsers = [
                        {
                            id: '1',
                            email: 'admin@example.com',
                            name: 'Admin User',
                            role: 'admin',
                            status: 'active',
                            createdAt: new Date('2024-01-15'),
                            lastLogin: new Date(),
                            emailVerified: true,
                            workspaces: 5,
                            agents: 12,
                        },
                        {
                            id: '2',
                            email: 'john@example.com',
                            name: 'John Doe',
                            role: 'user',
                            status: 'active',
                            createdAt: new Date('2024-03-20'),
                            lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
                            emailVerified: true,
                            workspaces: 3,
                            agents: 8,
                        },
                        {
                            id: '3',
                            email: 'jane@example.com',
                            name: 'Jane Smith',
                            role: 'moderator',
                            status: 'active',
                            createdAt: new Date('2024-02-10'),
                            lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000),
                            emailVerified: true,
                            workspaces: 2,
                            agents: 5,
                        },
                        {
                            id: '4',
                            email: 'inactive@example.com',
                            name: 'Inactive User',
                            role: 'user',
                            status: 'inactive',
                            createdAt: new Date('2023-12-01'),
                            lastLogin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                            emailVerified: false,
                            workspaces: 1,
                            agents: 0,
                        },
                        {
                            id: '5',
                            email: 'suspended@example.com',
                            name: 'Suspended User',
                            role: 'user',
                            status: 'suspended',
                            createdAt: new Date('2024-01-01'),
                            lastLogin: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
                            emailVerified: true,
                            workspaces: 0,
                            agents: 0,
                        },
                    ];
                    setUsers(mockUsers);
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error loading users:', error_1);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var filteredUsers = users.filter(function (user) {
        var matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        var matchesRole = selectedRole === 'all' || user.role === selectedRole;
        var matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
        return matchesSearch && matchesRole && matchesStatus;
    });
    var getRoleBadge = function (role) {
        var badges = {
            admin: 'bg-purple-100 text-purple-800',
            moderator: 'bg-blue-100 text-blue-800',
            user: 'bg-green-100 text-green-800',
            viewer: 'bg-gray-100 text-gray-800',
        };
        return badges[role];
    };
    var getStatusBadge = function (status) {
        var badges = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-yellow-100 text-yellow-800',
            suspended: 'bg-red-100 text-red-800',
        };
        return badges[status];
    };
    var formatDate = function (date) {
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };
    var formatLastLogin = function (date) {
        var now = new Date();
        var diff = now.getTime() - date.getTime();
        var hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1)
            return 'Just now';
        if (hours < 24)
            return "".concat(hours, "h ago");
        var days = Math.floor(hours / 24);
        if (days < 30)
            return "".concat(days, "d ago");
        var months = Math.floor(days / 30);
        return "".concat(months, "mo ago");
    };
    var handleSelectUser = function (userId) {
        var newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        }
        else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };
    var handleSelectAll = function () {
        if (selectedUsers.size === filteredUsers.length) {
            setSelectedUsers(new Set());
        }
        else {
            setSelectedUsers(new Set(filteredUsers.map(function (u) { return u.id; })));
        }
    };
    var handleDeleteUser = function (userId) {
        if (confirm('Are you sure you want to delete this user?')) {
            setUsers(users.filter(function (u) { return u.id !== userId; }));
        }
    };
    var handleBulkAction = function (action) {
        console.log("Performing ".concat(action, " on users:"), Array.from(selectedUsers));
        // Implement bulk actions
        setSelectedUsers(new Set());
    };
    return (_jsxs("div", { className: "p-8 max-w-[1600px] mx-auto bg-gray-50 min-h-screen", children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 mb-2 flex items-center", children: [_jsx(Users, { className: "h-8 w-8 mr-3 text-blue-600" }), "User Management"] }), _jsx("p", { className: "text-gray-600", children: "Manage users, roles, and permissions across the platform" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("button", { onClick: loadUsers, className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center", children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2 ".concat(loading ? 'animate-spin' : '') }), "Refresh"] }), _jsxs("button", { onClick: function () { return setShowCreateModal(true); }, className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center", children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Add User"] })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8", children: [_jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Total Users" }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: users.length })] }), _jsx(Users, { className: "h-12 w-12 text-blue-500 opacity-20" })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Active Users" }), _jsx("p", { className: "text-3xl font-bold text-green-600", children: users.filter(function (u) { return u.status === 'active'; }).length })] }), _jsx(Check, { className: "h-12 w-12 text-green-500 opacity-20" })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Admins" }), _jsx("p", { className: "text-3xl font-bold text-purple-600", children: users.filter(function (u) { return u.role === 'admin'; }).length })] }), _jsx(Shield, { className: "h-12 w-12 text-purple-500 opacity-20" })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Suspended" }), _jsx("p", { className: "text-3xl font-bold text-red-600", children: users.filter(function (u) { return u.status === 'suspended'; }).length })] }), _jsx(UserX, { className: "h-12 w-12 text-red-500 opacity-20" })] }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6 mb-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsx("div", { className: "md:col-span-2", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Search users by name or email...", value: searchTerm, onChange: function (e) { return setSearchTerm(e.target.value); }, className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }) }), _jsx("div", { children: _jsxs("select", { value: selectedRole, onChange: function (e) { return setSelectedRole(e.target.value); }, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "all", children: "All Roles" }), _jsx("option", { value: "admin", children: "Admin" }), _jsx("option", { value: "moderator", children: "Moderator" }), _jsx("option", { value: "user", children: "User" }), _jsx("option", { value: "viewer", children: "Viewer" })] }) }), _jsx("div", { children: _jsxs("select", { value: selectedStatus, onChange: function (e) { return setSelectedStatus(e.target.value); }, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "all", children: "All Status" }), _jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "inactive", children: "Inactive" }), _jsx("option", { value: "suspended", children: "Suspended" })] }) })] }), selectedUsers.size > 0 && (_jsxs("div", { className: "mt-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("span", { className: "text-sm font-medium text-gray-700", children: [selectedUsers.size, " user(s) selected"] }), _jsxs("button", { onClick: function () { return handleBulkAction('activate'); }, className: "text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700", children: [_jsx(Unlock, { className: "h-3 w-3 inline mr-1" }), "Activate"] }), _jsxs("button", { onClick: function () { return handleBulkAction('suspend'); }, className: "text-sm px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700", children: [_jsx(Lock, { className: "h-3 w-3 inline mr-1" }), "Suspend"] }), _jsxs("button", { onClick: function () { return handleBulkAction('delete'); }, className: "text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700", children: [_jsx(Trash2, { className: "h-3 w-3 inline mr-1" }), "Delete"] })] }), _jsx("button", { onClick: function () { return setSelectedUsers(new Set()); }, className: "text-sm text-gray-600 hover:text-gray-800", children: "Clear Selection" })] }))] }), _jsxs("div", { className: "bg-white rounded-lg shadow overflow-hidden", children: [_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left", children: _jsx("input", { type: "checkbox", checked: selectedUsers.size === filteredUsers.length && filteredUsers.length > 0, onChange: handleSelectAll, className: "h-4 w-4 text-blue-600 rounded" }) }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "User" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Role" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Workspaces/Agents" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Last Login" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Created" }), _jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: loading ? (_jsx("tr", { children: _jsxs("td", { colSpan: 8, className: "px-6 py-12 text-center", children: [_jsx(RefreshCw, { className: "h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" }), _jsx("p", { className: "text-gray-600", children: "Loading users..." })] }) })) : filteredUsers.length === 0 ? (_jsx("tr", { children: _jsxs("td", { colSpan: 8, className: "px-6 py-12 text-center", children: [_jsx(Users, { className: "h-12 w-12 text-gray-400 mx-auto mb-2" }), _jsx("p", { className: "text-gray-600", children: "No users found" })] }) })) : (filteredUsers.map(function (user) { return (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("input", { type: "checkbox", checked: selectedUsers.has(user.id), onChange: function () { return handleSelectUser(user.id); }, className: "h-4 w-4 text-blue-600 rounded" }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-blue-600 font-semibold", children: user.name.charAt(0).toUpperCase() }) }), _jsxs("div", { className: "ml-4", children: [_jsxs("div", { className: "text-sm font-medium text-gray-900 flex items-center", children: [user.name, user.emailVerified && (_jsx(Check, { className: "h-4 w-4 text-green-500 ml-1" }))] }), _jsx("div", { className: "text-sm text-gray-500", children: user.email })] })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ".concat(getRoleBadge(user.role)), children: user.role }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ".concat(getStatusBadge(user.status)), children: user.status }) }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: [user.workspaces, " / ", user.agents] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: formatLastLogin(user.lastLogin) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: formatDate(user.createdAt) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium", children: _jsxs("div", { className: "flex items-center justify-end space-x-2", children: [_jsx("button", { onClick: function () {
                                                                setSelectedUser(user);
                                                                setShowEditModal(true);
                                                            }, className: "text-blue-600 hover:text-blue-900", title: "Edit", children: _jsx(Edit, { className: "h-4 w-4" }) }), _jsx("button", { className: "text-green-600 hover:text-green-900", title: "View Details", children: _jsx(Eye, { className: "h-4 w-4" }) }), _jsx("button", { onClick: function () { return handleDeleteUser(user.id); }, className: "text-red-600 hover:text-red-900", title: "Delete", children: _jsx(Trash2, { className: "h-4 w-4" }) })] }) })] }, user.id)); })) })] }) }), _jsxs("div", { className: "bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200", children: [_jsxs("div", { className: "text-sm text-gray-700", children: ["Showing ", _jsx("span", { className: "font-medium", children: filteredUsers.length }), " of", ' ', _jsx("span", { className: "font-medium", children: users.length }), " users"] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { className: "px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm", children: "Previous" }), _jsx("button", { className: "px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm", children: "1" }), _jsx("button", { className: "px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm", children: "2" }), _jsx("button", { className: "px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm", children: "Next" })] })] })] }), _jsxs("div", { className: "mt-6 flex items-center justify-between", children: [_jsxs("div", { className: "text-sm text-gray-600", children: ["Last updated: ", new Date().toLocaleString()] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("button", { className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center text-sm", children: [_jsx(Download, { className: "h-4 w-4 mr-2" }), "Export CSV"] }), _jsxs("button", { className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center text-sm", children: [_jsx(Upload, { className: "h-4 w-4 mr-2" }), "Import Users"] })] })] })] }));
}
