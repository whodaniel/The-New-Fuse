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
import { useState, useEffect } from 'react';
import { OnboardingAdminService } from '../../../services/onboarding-admin.service';
import { Edit2, Trash2, Plus } from 'lucide-react';
export var OnboardingUserTypes = function (_a) {
    var onSave = _a.onSave, onChange = _a.onChange, hasUnsavedChanges = _a.hasUnsavedChanges;
    // Custom notification state to replace useToast
    var _b = useState(null), notification = _b[0], setNotification = _b[1];
    // Helper function to show notifications
    var showNotification = function (type, message) {
        setNotification({ type: type, message: message });
        setTimeout(function () { return setNotification(null); }, 5000);
    };
    // Modal state to replace useDisclosure
    var _c = useState(false), isOpen = _c[0], setIsOpen = _c[1];
    var onOpen = function () { return setIsOpen(true); };
    var onClose = function () { return setIsOpen(false); };
    var _d = useState(true), isLoading = _d[0], setIsLoading = _d[1];
    var _e = useState(null), error = _e[0], setError = _e[1];
    var _f = useState([]), userTypes = _f[0], setUserTypes = _f[1];
    var _g = useState(null), editingUserType = _g[0], setEditingUserType = _g[1];
    var _h = useState(false), isNewUserType = _h[0], setIsNewUserType = _h[1];
    // Fetch user types from API
    useEffect(function () {
        var fetchUserTypes = function () { return __awaiter(void 0, void 0, void 0, function () {
            var data, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, 3, 4]);
                        setIsLoading(true);
                        setError(null);
                        return [4 /*yield*/, OnboardingAdminService.getUserTypes()];
                    case 1:
                        data = _a.sent();
                        setUserTypes(data);
                        return [3 /*break*/, 4];
                    case 2:
                        err_1 = _a.sent();
                        console.error('Error fetching user types:', err_1);
                        setError('Failed to load user types. Please try again.');
                        // Set default user types if API fails
                        setUserTypes([
                            {
                                id: 'human',
                                name: 'Human User',
                                description: 'Regular human users of the platform',
                                enabled: true,
                                detectionMethod: 'behavior',
                                detectionConfig: {
                                    behaviorPattern: 'human-like interaction patterns'
                                },
                                onboardingFlow: 'human-onboarding',
                                priority: 10
                            },
                            {
                                id: 'ai_agent',
                                name: 'AI Agent',
                                description: 'AI agents that integrate with the platform',
                                enabled: true,
                                detectionMethod: 'header',
                                detectionConfig: {
                                    headerName: 'X-Agent-Type',
                                    headerValue: 'ai_agent'
                                },
                                onboardingFlow: 'ai-agent-onboarding',
                                priority: 20
                            }
                        ]);
                        return [3 /*break*/, 4];
                    case 3:
                        setIsLoading(false);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        fetchUserTypes();
    }, []);
    // Handle edit user type
    var handleEditUserType = function (userType) {
        setEditingUserType(__assign({}, userType));
        setIsNewUserType(false);
        onOpen();
    };
    // Handle add new user type
    var handleAddUserType = function () {
        setEditingUserType({
            id: '',
            name: '',
            description: '',
            enabled: true,
            detectionMethod: 'header',
            detectionConfig: {},
            onboardingFlow: '',
            priority: userTypes.length + 10
        });
        setIsNewUserType(true);
        onOpen();
    };
    // Handle delete user type
    var handleDeleteUserType = function (id) {
        if (window.confirm('Are you sure you want to delete this user type?')) {
            setUserTypes(userTypes.filter(function (ut) { return ut.id !== id; }));
            onChange();
        }
    };
    // Handle save user type
    var handleSaveUserType = function () {
        if (!editingUserType)
            return;
        if (isNewUserType) {
            setUserTypes(__spreadArray(__spreadArray([], userTypes, true), [editingUserType], false));
        }
        else {
            setUserTypes(userTypes.map(function (ut) { return ut.id === editingUserType.id ? editingUserType : ut; }));
        }
        onChange();
        onClose();
    };
    // Handle input change
    var handleInputChange = function (e) {
        var _a, _b, _c;
        if (!editingUserType)
            return;
        var _d = e.target, name = _d.name, value = _d.value, type = _d.type;
        if (type === 'checkbox') {
            var checked = e.target.checked;
            setEditingUserType(__assign(__assign({}, editingUserType), (_a = {}, _a[name] = checked, _a)));
        }
        else if (name.startsWith('detectionConfig.')) {
            var configKey = name.split('.')[1];
            setEditingUserType(__assign(__assign({}, editingUserType), { detectionConfig: __assign(__assign({}, editingUserType.detectionConfig), (_b = {}, _b[configKey] = value, _b)) }));
        }
        else {
            setEditingUserType(__assign(__assign({}, editingUserType), (_c = {}, _c[name] = value, _c)));
        }
    };
    // Handle detection method change
    var handleDetectionMethodChange = function (e) {
        if (!editingUserType)
            return;
        var method = e.target.value;
        // Reset detection config when method changes
        var detectionConfig = {};
        switch (method) {
            case 'header':
                detectionConfig = { headerName: '', headerValue: '' };
                break;
            case 'auth':
                detectionConfig = { authType: '' };
                break;
            case 'behavior':
                detectionConfig = { behaviorPattern: '' };
                break;
            case 'manual':
                detectionConfig = {};
                break;
        }
        setEditingUserType(__assign(__assign({}, editingUserType), { detectionMethod: method, detectionConfig: detectionConfig }));
    };
    // Handle save all changes
    var handleSaveChanges = function () { return __awaiter(void 0, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, OnboardingAdminService.updateUserTypes(userTypes)];
                case 1:
                    _a.sent();
                    onSave();
                    showNotification('success', 'User types have been saved successfully.');
                    return [3 /*break*/, 3];
                case 2:
                    err_2 = _a.sent();
                    console.error('Error saving user types:', err_2);
                    showNotification('error', 'Failed to save user types. Please try again.');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    // Get detection method display text
    var getDetectionMethodDisplay = function (userType) {
        switch (userType.detectionMethod) {
            case 'header':
                return "Header: ".concat(userType.detectionConfig.headerName);
            case 'auth':
                return "Auth Type: ".concat(userType.detectionConfig.authType);
            case 'behavior':
                return 'Behavior Analysis';
            case 'manual':
                return 'Manual Selection';
            default:
                return 'Unknown';
        }
    };
    return (_jsxs("div", { children: [notification && (_jsx("div", { className: "mb-4 p-4 rounded-md ".concat(notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                    notification.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                        'bg-blue-50 text-blue-800 border border-blue-200'), children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { children: notification.message }), _jsx("button", { onClick: function () { return setNotification(null); }, className: "text-gray-400 hover:text-gray-600", "aria-label": "Close notification", children: "\u00D7" })] }) })), isLoading && (_jsxs("div", { className: "text-center py-10", children: [_jsx("div", { className: "inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" }), _jsx("p", { className: "text-gray-600", children: "Loading user types..." })] })), error && !isLoading && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-md p-4 mb-4", children: _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("svg", { className: "h-5 w-5 text-red-400", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z", clipRule: "evenodd" }) }) }), _jsxs("div", { className: "ml-3 flex-1", children: [_jsx("h3", { className: "text-sm font-medium text-red-800", children: "Error Loading User Types" }), _jsx("p", { className: "mt-1 text-sm text-red-700", children: error })] }), _jsx("button", { onClick: function () { return window.location.reload(); }, className: "ml-3 bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200", children: "Retry" })] }) })), !isLoading && !error && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow border", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "User Types" }), _jsxs("button", { onClick: handleAddUserType, className: "inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Add User Type"] })] }) }), _jsxs("div", { className: "px-6 py-4", children: [_jsx("p", { className: "text-gray-600 mb-4", children: "Configure the different types of users that can access the platform. Each user type can have its own onboarding flow." }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Name" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Detection Method" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Onboarding Flow" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Priority" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: userTypes.map(function (userType) { return (_jsxs("tr", { children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex flex-col", children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: userType.name }), _jsx("div", { className: "text-sm text-gray-500", children: userType.description })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: getDetectionMethodDisplay(userType) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: userType.onboardingFlow }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: "inline-flex px-2 py-1 text-xs font-semibold rounded-full ".concat(userType.enabled
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-gray-100 text-gray-800'), children: userType.enabled ? 'Enabled' : 'Disabled' }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: userType.priority }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", children: _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: function () { return handleEditUserType(userType); }, className: "text-blue-600 hover:text-blue-900", "aria-label": "Edit user type", title: "Edit user type", children: _jsx(Edit2, { className: "h-4 w-4" }) }), _jsx("button", { onClick: function () { return handleDeleteUserType(userType.id); }, className: "text-red-600 hover:text-red-900", "aria-label": "Delete user type", title: "Delete user type", children: _jsx(Trash2, { className: "h-4 w-4" }) })] }) })] }, userType.id)); }) })] }) })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow border", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: _jsx("h3", { className: "text-lg font-medium text-gray-900", children: "User Type Detection" }) }), _jsxs("div", { className: "px-6 py-4", children: [_jsx("p", { className: "text-gray-600 mb-4", children: "Configure how the system detects different user types. User types are evaluated in order of priority (highest first)." }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", id: "enable-auto-detection", defaultChecked: true, className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" }), _jsx("label", { htmlFor: "enable-auto-detection", className: "ml-2 block text-sm text-gray-900", children: "Enable automatic user type detection" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", id: "allow-manual-override", defaultChecked: true, className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" }), _jsx("label", { htmlFor: "allow-manual-override", className: "ml-2 block text-sm text-gray-900", children: "Allow users to manually select their type" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", id: "remember-user-type", defaultChecked: true, className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" }), _jsx("label", { htmlFor: "remember-user-type", className: "ml-2 block text-sm text-gray-900", children: "Remember user type between sessions" })] })] })] })] }), _jsx("hr", { className: "my-6" }), _jsx("div", { className: "flex justify-end", children: _jsx("button", { onClick: handleSaveChanges, disabled: !hasUnsavedChanges, className: "px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ".concat(hasUnsavedChanges
                                ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                : 'bg-gray-300 cursor-not-allowed'), children: "Save Changes" }) })] })), isOpen && (_jsx("div", { className: "fixed inset-0 z-50 overflow-y-auto", children: _jsxs("div", { className: "flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0", children: [_jsx("div", { className: "fixed inset-0 transition-opacity", "aria-hidden": "true", children: _jsx("div", { className: "absolute inset-0 bg-gray-500 opacity-75" }) }), _jsx("span", { className: "hidden sm:inline-block sm:align-middle sm:h-screen", "aria-hidden": "true", children: "\u200B" }), _jsxs("div", { className: "inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full", children: [_jsxs("div", { className: "bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h3", { className: "text-lg leading-6 font-medium text-gray-900", children: isNewUserType ? 'Add User Type' : 'Edit User Type' }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600", "aria-label": "Close modal", children: _jsx("svg", { className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }), editingUserType && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { htmlFor: "user-type-id", className: "block text-sm font-medium text-gray-700", children: ["ID ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { id: "user-type-id", name: "id", type: "text", value: editingUserType.id, onChange: handleInputChange, placeholder: "e.g., human, ai_agent", readOnly: !isNewUserType, className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ".concat(!isNewUserType ? 'bg-gray-50' : '') }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Unique identifier for this user type" })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "user-type-name", className: "block text-sm font-medium text-gray-700", children: ["Name ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { id: "user-type-name", name: "name", type: "text", value: editingUserType.name, onChange: handleInputChange, placeholder: "e.g., Human User, AI Agent", className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "user-type-description", className: "block text-sm font-medium text-gray-700", children: "Description" }), _jsx("textarea", { id: "user-type-description", name: "description", value: editingUserType.description, onChange: handleInputChange, placeholder: "Describe this user type", rows: 2, className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", id: "user-type-enabled", name: "enabled", checked: editingUserType.enabled, onChange: function (e) { return setEditingUserType(__assign(__assign({}, editingUserType), { enabled: e.target.checked })); }, className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" }), _jsx("label", { htmlFor: "user-type-enabled", className: "ml-2 block text-sm text-gray-900", children: "Enabled" })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "detection-method", className: "block text-sm font-medium text-gray-700", children: ["Detection Method ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("select", { id: "detection-method", name: "detectionMethod", value: editingUserType.detectionMethod, onChange: handleDetectionMethodChange, title: "Detection method", className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm", children: [_jsx("option", { value: "header", children: "HTTP Header" }), _jsx("option", { value: "auth", children: "Authentication Type" }), _jsx("option", { value: "behavior", children: "Behavior Analysis" }), _jsx("option", { value: "manual", children: "Manual Selection" })] })] }), editingUserType.detectionMethod === 'header' && (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsxs("label", { htmlFor: "header-name", className: "block text-sm font-medium text-gray-700", children: ["Header Name ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { id: "header-name", name: "detectionConfig.headerName", type: "text", value: editingUserType.detectionConfig.headerName || '', onChange: handleInputChange, placeholder: "e.g., X-Agent-Type", className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "header-value", className: "block text-sm font-medium text-gray-700", children: ["Header Value ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { id: "header-value", name: "detectionConfig.headerValue", type: "text", value: editingUserType.detectionConfig.headerValue || '', onChange: handleInputChange, placeholder: "e.g., ai_agent", className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" })] })] })), editingUserType.detectionMethod === 'auth' && (_jsxs("div", { children: [_jsxs("label", { htmlFor: "auth-type", className: "block text-sm font-medium text-gray-700", children: ["Authentication Type ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { id: "auth-type", name: "detectionConfig.authType", type: "text", value: editingUserType.detectionConfig.authType || '', onChange: handleInputChange, placeholder: "e.g., api_key, oauth, password", className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" })] })), editingUserType.detectionMethod === 'behavior' && (_jsxs("div", { children: [_jsxs("label", { htmlFor: "behavior-pattern", className: "block text-sm font-medium text-gray-700", children: ["Behavior Pattern ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { id: "behavior-pattern", name: "detectionConfig.behaviorPattern", type: "text", value: editingUserType.detectionConfig.behaviorPattern || '', onChange: handleInputChange, placeholder: "e.g., human-like interaction patterns", className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "This is a simplified representation. In a real implementation, behavior patterns would be configured more extensively." })] })), _jsxs("div", { children: [_jsxs("label", { htmlFor: "onboarding-flow", className: "block text-sm font-medium text-gray-700", children: ["Onboarding Flow ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { id: "onboarding-flow", name: "onboardingFlow", type: "text", value: editingUserType.onboardingFlow, onChange: handleInputChange, placeholder: "e.g., human-onboarding, ai-agent-onboarding", className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "The ID of the onboarding flow to use for this user type" })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "priority", className: "block text-sm font-medium text-gray-700", children: ["Priority ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { id: "priority", name: "priority", type: "number", value: editingUserType.priority, onChange: handleInputChange, placeholder: "e.g., 10", className: "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Higher priority user types are evaluated first during detection" })] })] }))] }), _jsxs("div", { className: "bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse", children: [_jsx("button", { type: "button", onClick: handleSaveUserType, className: "w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm", children: "Save" }), _jsx("button", { type: "button", onClick: onClose, className: "mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm", children: "Cancel" })] })] })] }) }))] }));
};
