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
import { OnboardingAdminService } from '../../../services/onboarding-admin.service';
import { OnboardingAnalytics } from './OnboardingAnalytics';
import { Info, CheckCircle, AlertCircle } from 'lucide-react';
export var OnboardingWizardPreview = function () {
    // Custom notification state to replace useToast
    var _a = useState(null), notification = _a[0], setNotification = _a[1];
    // Helper function to show notifications
    var showNotification = function (type, message) {
        setNotification({ type: type, message: message });
        setTimeout(function () { return setNotification(null); }, 5000);
    };
    var _b = useState('preview'), activeTab = _b[0], setActiveTab = _b[1];
    var _c = useState('human'), userType = _c[0], setUserType = _c[1];
    var _d = useState(false), isFullscreen = _d[0], setIsFullscreen = _d[1];
    var _e = useState(false), isLoading = _e[0], setIsLoading = _e[1];
    var _f = useState(null), previewError = _f[0], setPreviewError = _f[1];
    var _g = useState(null), validationResults = _g[0], setValidationResults = _g[1];
    // Load the preview
    var handleRefreshPreview = function () { return __awaiter(void 0, void 0, void 0, function () {
        var validationResult, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    setPreviewError(null);
                    setValidationResults(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, OnboardingAdminService.validateConfiguration()];
                case 2:
                    validationResult = _a.sent();
                    if (validationResult.status === 'error') {
                        setPreviewError('Failed to load preview. The onboarding configuration contains errors.');
                        setValidationResults(validationResult);
                    }
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    console.error('Error validating configuration:', err_1);
                    setPreviewError('Failed to load preview. An error occurred while validating the configuration.');
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // Initial load
    useEffect(function () {
        handleRefreshPreview();
    }, []);
    var handleToggleFullscreen = function () {
        setIsFullscreen(!isFullscreen);
    };
    var handleChangeUserType = function (e) {
        setUserType(e.target.value);
        handleRefreshPreview();
    };
    var handleRunValidation = function () { return __awaiter(void 0, void 0, void 0, function () {
        var validationResult, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, OnboardingAdminService.validateConfiguration()];
                case 2:
                    validationResult = _a.sent();
                    setValidationResults(validationResult);
                    showNotification(validationResult.status === 'success' ? 'success' : 'info', "Validation ".concat(validationResult.status === 'success' ? 'Passed' : 'Completed', ": ").concat(validationResult.message));
                    return [3 /*break*/, 5];
                case 3:
                    err_2 = _a.sent();
                    console.error('Error validating configuration:', err_2);
                    showNotification('error', 'An error occurred while validating the configuration.');
                    setValidationResults(null);
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs("div", { children: [notification && (_jsx("div", { className: "mb-4 p-4 rounded-md border ".concat(notification.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                    : notification.type === 'error'
                        ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
                        : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200'), children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [notification.type === 'success' && _jsx(CheckCircle, { className: "w-5 h-5 mr-2" }), notification.type === 'error' && _jsx(AlertCircle, { className: "w-5 h-5 mr-2" }), notification.type === 'info' && _jsx(Info, { className: "w-5 h-5 mr-2" }), _jsx("span", { children: notification.message })] }), _jsx("button", { onClick: function () { return setNotification(null); }, className: "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300", children: "\u00D7" })] }) })), _jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: "Onboarding Wizard Preview" }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "max-w-48", children: _jsxs("select", { value: userType, onChange: handleChangeUserType, className: "px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500", "aria-label": "Select user type", title: "Select user type for preview", children: [_jsx("option", { value: "human", children: "Human User" }), _jsx("option", { value: "ai_agent", children: "AI Agent" })] }) }), _jsx("button", { onClick: handleRefreshPreview, disabled: isLoading, className: "p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50", "aria-label": "Refresh preview", title: "Refresh Preview", children: _jsx(FiRefreshCw, { className: "w-4 h-4 ".concat(isLoading ? 'animate-spin' : '') }) }), _jsx("button", { onClick: handleToggleFullscreen, className: "p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400", "aria-label": "Toggle fullscreen", title: isFullscreen ? "Exit Fullscreen" : "Fullscreen", children: isFullscreen ? _jsx(FiMinimize2, { className: "w-4 h-4" }) : _jsx(FiMaximize2, { className: "w-4 h-4" }) })] })] }), _jsx("p", { className: "mb-4 text-gray-600 dark:text-gray-400", children: "Preview how the onboarding wizard will appear to users. You can switch between user types to see different onboarding flows." }), previewError && (_jsx("div", { className: "mb-4 p-4 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-start", children: [_jsx(FiAlertCircle, { className: "w-5 h-5 text-red-600 dark:text-red-400 mr-2 mt-0.5" }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-red-800 dark:text-red-200", children: "Preview Error!" }), _jsx("p", { className: "text-red-700 dark:text-red-300", children: previewError })] })] }), _jsx("button", { onClick: function () { return setPreviewError(null); }, className: "text-red-400 hover:text-red-600 dark:hover:text-red-300", children: "\u00D7" })] }) })), _jsxs("div", { className: "mb-6", children: [_jsx("div", { className: "border-b border-gray-200 dark:border-gray-700", children: _jsxs("nav", { className: "-mb-px flex space-x-8", children: [_jsx("button", { className: "py-2 px-1 border-b-2 font-medium text-sm ".concat(activeTab === 'preview'
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'), onClick: function () { return setActiveTab('preview'); }, children: "Preview" }), _jsx("button", { className: "py-2 px-1 border-b-2 font-medium text-sm ".concat(activeTab === 'validation'
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'), onClick: function () { return setActiveTab('validation'); }, children: "Validation" }), _jsx("button", { className: "py-2 px-1 border-b-2 font-medium text-sm ".concat(activeTab === 'analytics'
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'), onClick: function () { return setActiveTab('analytics'); }, children: "Analytics" })] }) }), _jsxs("div", { className: "pt-4", children: [activeTab === 'preview' && (_jsxs("div", { children: [_jsx("div", { className: "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden ".concat(isFullscreen ? 'h-[calc(100vh-300px)]' : 'h-96'), children: isLoading ? (_jsx("div", { className: "flex justify-center items-center h-full", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Loading preview..." })] }) })) : previewError ? (_jsx("div", { className: "flex justify-center items-center h-full p-8", children: _jsxs("div", { className: "text-center", children: [_jsx(FiAlertCircle, { className: "w-12 h-12 text-red-500 mx-auto mb-4" }), _jsx("p", { className: "text-red-500 font-semibold mb-2", children: "Failed to load preview" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400 mb-4", children: "Please fix the configuration errors and try again." }), _jsx("button", { onClick: handleRefreshPreview, className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors", children: "Try Again" })] }) })) : (_jsx("iframe", { src: "/preview/onboarding?userType=".concat(userType), className: "w-full h-full border-none rounded-md", title: "Onboarding Preview" })) }), _jsxs("div", { className: "flex items-center space-x-4 mt-4", children: [_jsxs("button", { onClick: handleRefreshPreview, disabled: isLoading, className: "flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors", children: [_jsx(FiRefreshCw, { className: "w-4 h-4 mr-2" }), "Refresh Preview"] }), _jsx("button", { onClick: function () {
                                                    window.open("/preview/onboarding?userType=".concat(userType), '_blank');
                                                }, className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors", children: "Open in New Tab" })] })] })), activeTab === 'validation' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow-sm", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200 dark:border-gray-700", children: _jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Validation Results" }) }), _jsxs("div", { className: "p-6", children: [_jsx("button", { onClick: handleRunValidation, disabled: isLoading, className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors mb-4", children: isLoading ? 'Running...' : 'Run Validation' }), validationResults && (_jsx("div", { className: "p-4 rounded-md border ".concat(validationResults.status === 'success'
                                                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                                                            : validationResults.status === 'warning'
                                                                ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                                                                : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'), children: _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0 mr-3", children: validationResults.status === 'success' ? (_jsx(FiCheckCircle, { className: "w-6 h-6 text-green-500" })) : validationResults.status === 'warning' ? (_jsx(FiInfo, { className: "w-6 h-6 text-yellow-500" })) : (_jsx(FiAlertCircle, { className: "w-6 h-6 text-red-500" })) }), _jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "text-lg font-semibold ".concat(validationResults.status === 'success'
                                                                                ? 'text-green-800 dark:text-green-200'
                                                                                : validationResults.status === 'warning'
                                                                                    ? 'text-yellow-800 dark:text-yellow-200'
                                                                                    : 'text-red-800 dark:text-red-200'), children: validationResults.message }), validationResults.details && validationResults.details.length > 0 && (_jsxs("div", { className: "mt-4 ml-2", children: [_jsx("p", { className: "font-semibold text-gray-900 dark:text-white mb-2", children: "Details:" }), _jsx("div", { className: "space-y-1", children: validationResults.details.map(function (detail, index) { return (_jsxs("div", { className: "flex items-start", children: [_jsx("span", { className: "text-gray-500 mr-2", children: "\u2022" }), _jsx("span", { className: "text-gray-700 dark:text-gray-300", children: detail })] }, index)); }) })] }))] })] }) }))] })] }), _jsxs("div", { className: "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow-sm", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200 dark:border-gray-700", children: _jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Best Practices" }) }), _jsx("div", { className: "p-6", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0 mt-1 mr-3", children: _jsx(FiCheckCircle, { className: "w-5 h-5 text-green-500" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: "Keep it simple" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Limit the number of steps to 5-7 for human users and 3-4 for AI agents." })] })] }), _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0 mt-1 mr-3", children: _jsx(FiCheckCircle, { className: "w-5 h-5 text-green-500" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: "Clear instructions" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Each step should have clear instructions and purpose." })] })] }), _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0 mt-1 mr-3", children: _jsx(FiCheckCircle, { className: "w-5 h-5 text-green-500" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: "Visual cues" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Use images and icons to guide users through the process." })] })] }), _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0 mt-1 mr-3", children: _jsx(FiCheckCircle, { className: "w-5 h-5 text-green-500" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: "Progress indicators" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Show users how far they've come and how much is left." })] })] }), _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0 mt-1 mr-3", children: _jsx(FiCheckCircle, { className: "w-5 h-5 text-green-500" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: "Skip options" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Allow users to skip non-essential steps." })] })] })] }) })] })] })), activeTab === 'analytics' && (_jsx(OnboardingAnalytics, {}))] })] })] }));
};
