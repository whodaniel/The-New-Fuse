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
import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
var availableModules = [
    {
        category: 'Core',
        modules: [
            { name: 'User Authentication', description: 'Secure user login and registration system' },
            { name: 'Database Integration', description: "Connect and manage your app's data" },
            { name: 'Payment Processing', description: 'Handle transactions securely' },
            { name: 'Analytics Dashboard', description: 'Track and visualize app usage data' },
        ],
    },
    {
        category: 'Media & Content',
        modules: [
            { name: 'Media Player', description: 'Play audio and video content with customizable controls' },
            { name: 'Image Gallery', description: 'Display and manage image collections' },
            { name: 'Content Editor', description: 'Rich text editing capabilities' },
            { name: 'File Manager', description: 'Upload and manage files' },
        ],
    },
];
export function AppCreator() {
    var _this = this;
    var _a = useState(''), appName = _a[0], setAppName = _a[1];
    var _b = useState(''), creatorName = _b[0], setCreatorName = _b[1];
    var _c = useState(''), description = _c[0], setDescription = _c[1];
    var _d = useState([]), selectedModules = _d[0], setSelectedModules = _d[1];
    var _e = useState({
        theme: 'light',
        primaryColor: '#4444FF',
    }), customizationOptions = _e[0], setCustomizationOptions = _e[1];
    var _f = useState(false), isLoading = _f[0], setIsLoading = _f[1];
    var _g = useState(''), error = _g[0], setError = _g[1];
    var _h = useState(''), successMessage = _h[0], setSuccessMessage = _h[1];
    var handleModuleToggle = function (moduleName) {
        setSelectedModules(function (prev) {
            return prev.includes(moduleName)
                ? prev.filter(function (name) { return name !== moduleName; })
                : __spreadArray(__spreadArray([], prev, true), [moduleName], false);
        });
    };
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    setIsLoading(true);
                    setError('');
                    setSuccessMessage('');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                case 2:
                    _a.sent();
                    setSuccessMessage('App created successfully!');
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    setError('Failed to create app. Please try again.');
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (_jsx("div", { className: "max-w-4xl mx-auto p-6", children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Create New App" }), _jsx(CardDescription, { children: "Configure your app's basic information and features" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "App Name" }), _jsx(Input, { type: "text", value: appName, onChange: function (e) { return setAppName(e.target.value); }, required: true })] }), _jsxs("div", { children: [_jsx(Label, { children: "Creator Name" }), _jsx(Input, { type: "text", value: creatorName, onChange: function (e) { return setCreatorName(e.target.value); } })] }), _jsxs("div", { children: [_jsx(Label, { children: "Description" }), _jsx(Textarea, { value: description, onChange: function (e) { return setDescription(e.target.value); }, rows: 4 })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx(Label, { children: "Select Modules" }), availableModules.map(function (category) { return (_jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "font-medium text-gray-700", children: category.category }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: category.modules.map(function (module) { return (_jsx(Card, { className: "cursor-pointer transition-all ".concat(selectedModules.includes(module.name)
                                                            ? 'bg-blue-100 border-blue-500'
                                                            : 'bg-white'), onClick: function () { return handleModuleToggle(module.name); }, children: _jsxs(CardContent, { className: "p-4", children: [_jsx("h4", { className: "font-medium", children: module.name }), _jsx("p", { className: "text-sm text-gray-600", children: module.description })] }) }, module.name)); }) })] }, category.category)); })] }), _jsxs("div", { className: "space-y-4", children: [_jsx(Label, { children: "Customization" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Theme" }), _jsxs("select", { "aria-label": "Theme", value: customizationOptions.theme, onChange: function (e) {
                                                                return setCustomizationOptions(function (prev) { return (__assign(__assign({}, prev), { theme: e.target.value })); });
                                                            }, className: "w-full mt-1 px-3 py-2 border rounded-lg", children: [_jsx("option", { value: "light", children: "Light" }), _jsx("option", { value: "dark", children: "Dark" })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Primary Color" }), _jsx(Input, { type: "color", value: customizationOptions.primaryColor, onChange: function (e) {
                                                                return setCustomizationOptions(function (prev) { return (__assign(__assign({}, prev), { primaryColor: e.target.value })); });
                                                            } })] })] })] })] })] }), _jsxs("div", { className: "flex justify-end space-x-4", children: [_jsx(Button, { variant: "outline", onClick: function () { return window.location.reload(); }, disabled: isLoading, children: "Reset" }), _jsx(Button, { type: "submit", disabled: isLoading, children: isLoading ? 'Creating...' : 'Create App' })] }), error && (_jsx("div", { className: "p-4 bg-red-50 text-red-600 rounded-lg", children: error })), successMessage && (_jsx("div", { className: "p-4 bg-green-50 text-green-600 rounded-lg", children: successMessage }))] }) }));
}
