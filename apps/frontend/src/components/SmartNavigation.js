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
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
// Smart Navigation Component that adapts based on authentication status and user role
function SmartNavigation() {
    var _this = this;
    var _a = useState(null), activeDropdown = _a[0], setActiveDropdown = _a[1];
    var location = useLocation();
    var _b = useAuth(), isAuthenticated = _b.isAuthenticated, user = _b.user, logout = _b.logout;
    var navRef = useRef(null);
    // Check if user has admin role
    var isAdmin = (user === null || user === void 0 ? void 0 : user.role) === 'admin' || (user === null || user === void 0 ? void 0 : user.role) === 'administrator';
    var isPublicPage = ['/', '/login', '/register', '/legal/privacy', '/legal/terms'].includes(location.pathname);
    var toggleDropdown = function (dropdown) {
        setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
    };
    // Close dropdown when clicking outside
    useEffect(function () {
        var handleClickOutside = function (event) {
            if (navRef.current && !navRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return function () {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    // Close dropdown when navigating to a new page
    useEffect(function () {
        setActiveDropdown(null);
    }, [location.pathname]);
    // Public Navigation (for non-authenticated users)
    if (!isAuthenticated || isPublicPage) {
        return (_jsx("nav", { ref: navRef, className: "bg-white shadow-sm border-b", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between h-16", children: [_jsx("div", { className: "flex items-center", children: _jsxs(Link, { to: "/", className: "flex-shrink-0 flex items-center", children: [_jsx("div", { className: "h-8 w-8 bg-blue-600 rounded-md flex items-center justify-center", children: _jsx("span", { className: "text-white font-bold text-sm", children: "\uD83D\uDE80" }) }), _jsx("h1", { className: "ml-2 text-xl font-bold text-gray-900", children: "The New Fuse" })] }) }), _jsxs("div", { className: "hidden md:flex items-center space-x-8", children: [_jsx(Link, { to: "/#features", className: "text-gray-500 hover:text-blue-600 transition-colors", onClick: function (e) {
                                        if (location.pathname === '/') {
                                            e.preventDefault();
                                            var featuresElement = document.getElementById('features');
                                            if (featuresElement) {
                                                featuresElement.scrollIntoView({ behavior: 'smooth' });
                                            }
                                        }
                                    }, children: "Features" }), _jsx(Link, { to: "/agents", className: "text-gray-500 hover:text-blue-600 transition-colors", children: "AI Agents" }), _jsx(Link, { to: "/workflows", className: "text-gray-500 hover:text-blue-600 transition-colors", children: "Workflows" }), _jsx(Link, { to: "/resources", className: "text-gray-500 hover:text-blue-600 transition-colors", children: "Resources" }), _jsx(Link, { to: "/analytics", className: "text-gray-500 hover:text-blue-600 transition-colors", children: "Analytics" })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx(Link, { to: "/login", className: "text-gray-500 hover:text-blue-600 font-medium transition-colors", children: "Sign In" }), _jsx(Link, { to: "/register", className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors", children: "Get Started Free" })] })] }) }) }));
    }
    // Authenticated User Navigation
    return (_jsx("nav", { ref: navRef, className: "bg-blue-600 text-white p-4 shadow-lg relative", children: _jsxs("div", { className: "max-w-7xl mx-auto flex items-center justify-between", children: [_jsx(Link, { to: "/dashboard", className: "text-xl font-bold hover:text-blue-200 transition-colors", children: "\uD83D\uDE80 The New Fuse" }), _jsxs("div", { className: "flex items-center space-x-2 flex-wrap", children: [_jsx(Link, { to: "/dashboard", className: "hover:text-blue-200 px-3 py-2 rounded transition-colors", children: "\uD83D\uDCCA Dashboard" }), _jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: function () { return toggleDropdown('agents'); }, className: "hover:text-blue-200 px-3 py-2 rounded transition-colors bg-blue-700 flex items-center", children: ["\uD83E\uDD16 AI Agents ", _jsx("span", { className: "ml-1", children: "\u25BC" })] }), activeDropdown === 'agents' && (_jsxs("div", { className: "absolute top-full left-0 mt-1 bg-white text-black rounded shadow-lg z-50 min-w-48", children: [_jsx(Link, { to: "/agents", className: "block px-4 py-2 hover:bg-gray-100", children: "\uD83D\uDCCB All Agents" }), _jsx(Link, { to: "/agents/new", className: "block px-4 py-2 hover:bg-gray-100", children: "\u2795 Create Agent" }), _jsx(Link, { to: "/agents/unified-creator", className: "block px-4 py-2 hover:bg-gray-100", children: "\uD83D\uDE80 Unified Creator" }), _jsx(Link, { to: "/dashboard/agents", className: "block px-4 py-2 hover:bg-gray-100", children: "\uD83D\uDCCA Agent Dashboard" })] }))] }), _jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: function () { return toggleDropdown('workflows'); }, className: "hover:text-blue-200 px-3 py-2 rounded transition-colors bg-indigo-600 flex items-center", children: ["\uD83D\uDD04 Workflows ", _jsx("span", { className: "ml-1", children: "\u25BC" })] }), activeDropdown === 'workflows' && (_jsxs("div", { className: "absolute top-full left-0 mt-1 bg-white text-black rounded shadow-lg z-50 min-w-48", children: [_jsx(Link, { to: "/workflows", className: "block px-4 py-2 hover:bg-gray-100", children: "\uD83D\uDD04 All Workflows" }), _jsx(Link, { to: "/workflows/builder", className: "block px-4 py-2 hover:bg-gray-100", children: "\uD83D\uDEE0\uFE0F Workflow Builder" }), _jsx(Link, { to: "/workflows/templates", className: "block px-4 py-2 hover:bg-gray-100", children: "\uD83D\uDCC4 Templates" }), _jsx(Link, { to: "/workflows/executions", className: "block px-4 py-2 hover:bg-gray-100", children: "\uD83D\uDCCA Executions" })] }))] }), _jsx(Link, { to: "/resources", className: "hover:text-blue-200 px-3 py-2 rounded transition-colors bg-gradient-to-r from-purple-600 to-pink-600", children: "\uD83D\uDCE6 Resources" }), _jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: function () { return toggleDropdown('tasks'); }, className: "hover:text-blue-200 px-3 py-2 rounded transition-colors bg-green-600 flex items-center", children: ["\uD83D\uDCCB Tasks ", _jsx("span", { className: "ml-1", children: "\u25BC" })] }), activeDropdown === 'tasks' && (_jsxs("div", { className: "absolute top-full left-0 mt-1 bg-white text-black rounded shadow-lg z-50 min-w-48", children: [_jsx(Link, { to: "/tasks", className: "block px-4 py-2 hover:bg-gray-100", children: "\uD83D\uDCCB All Tasks" }), _jsx(Link, { to: "/tasks/new", className: "block px-4 py-2 hover:bg-gray-100", children: "\u2795 New Task" }), _jsx(Link, { to: "/suggestions", className: "block px-4 py-2 hover:bg-gray-100", children: "\uD83D\uDCA1 Suggestions" })] }))] }), _jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: function () { return toggleDropdown('workspace'); }, className: "hover:text-blue-200 px-3 py-2 rounded transition-colors bg-purple-600 flex items-center", children: ["\uD83C\uDFE2 Workspace ", _jsx("span", { className: "ml-1", children: "\u25BC" })] }), activeDropdown === 'workspace' && (_jsxs("div", { className: "absolute top-full left-0 mt-1 bg-white text-black rounded shadow-lg z-50 min-w-48", children: [_jsx(Link, { to: "/workspace/overview", className: "block px-4 py-2 hover:bg-gray-100", children: "\uD83D\uDCCB Overview" }), _jsx(Link, { to: "/workspace/analytics", className: "block px-4 py-2 hover:bg-gray-100", children: "\uD83D\uDCCA Analytics" }), _jsx(Link, { to: "/workspace/members", className: "block px-4 py-2 hover:bg-gray-100", children: "\uD83D\uDC65 Members" }), _jsx(Link, { to: "/workspace/chat", className: "block px-4 py-2 hover:bg-gray-100", children: "\uD83D\uDCAC Chat" }), _jsx(Link, { to: "/workspace/settings", className: "block px-4 py-2 hover:bg-gray-100", children: "\u2699\uFE0F Settings" })] }))] }), _jsx(Link, { to: "/analytics", className: "hover:text-blue-200 px-3 py-2 rounded transition-colors", children: "\uD83D\uDCCA Analytics" }), isAdmin && (_jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: function () { return toggleDropdown('admin'); }, className: "hover:text-blue-200 px-3 py-2 rounded transition-colors bg-red-600 flex items-center", children: ["\uD83D\uDC68\u200D\uD83D\uDCBC Admin ", _jsx("span", { className: "ml-1", children: "\u25BC" })] }), activeDropdown === 'admin' && (_jsxs("div", { className: "absolute top-full left-0 mt-1 bg-white text-black rounded shadow-lg z-50 min-w-48", children: [_jsx(Link, { to: "/admin/dashboard", className: "block px-4 py-2 hover:bg-gray-100", children: "\uD83D\uDCCA Admin Dashboard" }), _jsx(Link, { to: "/admin/users", className: "block px-4 py-2 hover:bg-gray-100", children: "\uD83D\uDC65 User Management" }), _jsx(Link, { to: "/admin/workspaces", className: "block px-4 py-2 hover:bg-gray-100", children: "\uD83C\uDFE2 Workspaces" }), _jsx(Link, { to: "/admin/system-health", className: "block px-4 py-2 hover:bg-gray-100", children: "\uD83D\uDC9A System Health" }), _jsx(Link, { to: "/admin/feature-flags", className: "block px-4 py-2 hover:bg-gray-100", children: "\uD83C\uDFF4 Feature Flags" }), _jsx(Link, { to: "/admin/settings", className: "block px-4 py-2 hover:bg-gray-100", children: "\u2699\uFE0F Admin Settings" })] }))] })), _jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: function () { return toggleDropdown('settings'); }, className: "hover:text-blue-200 px-3 py-2 rounded transition-colors bg-gray-600 flex items-center", children: ["\u2699\uFE0F Settings ", _jsx("span", { className: "ml-1", children: "\u25BC" })] }), activeDropdown === 'settings' && (_jsxs("div", { className: "absolute top-full left-0 mt-1 bg-white text-black rounded shadow-lg z-50 min-w-48", children: [_jsx(Link, { to: "/settings", className: "block px-4 py-2 hover:bg-gray-100", children: "\u2699\uFE0F General" }), _jsx(Link, { to: "/settings/appearance", className: "block px-4 py-2 hover:bg-gray-100", children: "\uD83C\uDFA8 Appearance" }), _jsx(Link, { to: "/settings/notifications", className: "block px-4 py-2 hover:bg-gray-100", children: "\uD83D\uDD14 Notifications" }), _jsx(Link, { to: "/settings/security", className: "block px-4 py-2 hover:bg-gray-100", children: "\uD83D\uDD12 Security" }), _jsx(Link, { to: "/settings/api", className: "block px-4 py-2 hover:bg-gray-100", children: "\uD83D\uDD0C API Settings" })] }))] }), _jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: function () { return toggleDropdown('user'); }, className: "hover:text-blue-200 px-3 py-2 rounded transition-colors bg-gray-700 flex items-center", children: ["\uD83D\uDC64 User ", _jsx("span", { className: "ml-1", children: "\u25BC" })] }), activeDropdown === 'user' && (_jsxs("div", { className: "absolute top-full right-0 mt-1 bg-white text-black rounded shadow-lg z-50 min-w-48", children: [_jsx(Link, { to: "/profile", className: "block px-4 py-2 hover:bg-gray-100", children: "\uD83D\uDC64 Profile" }), _jsx(Link, { to: "/settings", className: "block px-4 py-2 hover:bg-gray-100", children: "\u2699\uFE0F Settings" }), _jsx("div", { className: "border-t border-gray-200" }), _jsx("button", { onClick: function () { return __awaiter(_this, void 0, void 0, function () {
                                                var error_1;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            _a.trys.push([0, 2, , 3]);
                                                            return [4 /*yield*/, logout()];
                                                        case 1:
                                                            _a.sent();
                                                            setActiveDropdown(null);
                                                            return [3 /*break*/, 3];
                                                        case 2:
                                                            error_1 = _a.sent();
                                                            console.error('Logout failed:', error_1);
                                                            return [3 /*break*/, 3];
                                                        case 3: return [2 /*return*/];
                                                    }
                                                });
                                            }); }, className: "block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600", children: "\uD83D\uDEAA Sign Out" })] }))] })] })] }) }));
}
export default SmartNavigation;
