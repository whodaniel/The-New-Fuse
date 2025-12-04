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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useAnalytics } from '../../hooks/useAnalytics';
/**
 * Email Signup Form Component
 *
 * Features:
 * - Email validation (RFC 5322 compliant)
 * - Loading states
 * - Success/error feedback
 * - Multiple variants (early access, newsletter, waitlist)
 * - Analytics tracking
 * - Privacy notice
 */
export var EmailSignupForm = function (_a) {
    var _b = _a.title, title = _b === void 0 ? 'Get Early Access' : _b, _c = _a.description, description = _c === void 0 ? 'Be the first to know when we launch new features.' : _c, _d = _a.placeholder, placeholder = _d === void 0 ? 'Enter your email' : _d, _e = _a.buttonText, buttonText = _e === void 0 ? 'Join Waitlist' : _e, _f = _a.type, type = _f === void 0 ? 'early-access' : _f, onSubmit = _a.onSubmit, _g = _a.className, className = _g === void 0 ? '' : _g, _h = _a.showPrivacyNote, showPrivacyNote = _h === void 0 ? true : _h;
    var _j = useState({
        email: '',
        status: 'idle',
        error: null,
    }), formState = _j[0], setFormState = _j[1];
    var trackEvent = useAnalytics().trackEvent;
    // Email validation using regex
    var validateEmail = function (email) {
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    // Reset error state
                    setFormState(function (prev) { return (__assign(__assign({}, prev), { error: null })); });
                    // Validate email
                    if (!formState.email) {
                        setFormState(function (prev) { return (__assign(__assign({}, prev), { error: 'Email is required', status: 'error' })); });
                        trackEvent('form_error', {
                            form_type: type,
                            error: 'empty_email',
                        });
                        return [2 /*return*/];
                    }
                    if (!validateEmail(formState.email)) {
                        setFormState(function (prev) { return (__assign(__assign({}, prev), { error: 'Please enter a valid email address', status: 'error' })); });
                        trackEvent('form_error', {
                            form_type: type,
                            error: 'invalid_email',
                        });
                        return [2 /*return*/];
                    }
                    // Set loading state
                    setFormState(function (prev) { return (__assign(__assign({}, prev), { status: 'loading' })); });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    if (!onSubmit) return [3 /*break*/, 3];
                    return [4 /*yield*/, onSubmit(formState.email, type)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    // Success state
                    setFormState(function (prev) { return (__assign(__assign({}, prev), { status: 'success' })); });
                    trackEvent('form_submit', {
                        form_type: type,
                        location: 'email_signup',
                    });
                    // Reset form after 3 seconds
                    setTimeout(function () {
                        setFormState({
                            email: '',
                            status: 'idle',
                            error: null,
                        });
                    }, 3000);
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    setFormState(function (prev) { return (__assign(__assign({}, prev), { status: 'error', error: error_1 instanceof Error ? error_1.message : 'Something went wrong. Please try again.' })); });
                    trackEvent('form_error', {
                        form_type: type,
                        error: 'submission_failed',
                    });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleEmailChange = function (e) {
        setFormState(function (prev) { return (__assign(__assign({}, prev), { email: e.target.value, status: 'idle', error: null })); });
    };
    return (_jsxs("div", { className: "max-w-md mx-auto ".concat(className), children: [title && (_jsx("h3", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center", children: title })), description && (_jsx("p", { className: "text-gray-600 dark:text-gray-400 mb-6 text-center", children: description })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "relative", children: [_jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" }), _jsx(Input, { type: "email", value: formState.email, onChange: handleEmailChange, placeholder: placeholder, disabled: formState.status === 'loading' || formState.status === 'success', className: "pl-10 ".concat(formState.error
                                            ? 'border-red-500 focus-visible:ring-red-500'
                                            : formState.status === 'success'
                                                ? 'border-green-500 focus-visible:ring-green-500'
                                                : ''), "aria-label": "Email address", "aria-invalid": !!formState.error, "aria-describedby": formState.error ? 'email-error' : undefined })] }), formState.error && (_jsxs("div", { id: "email-error", className: "flex items-center gap-2 mt-2 text-sm text-red-600", children: [_jsx(AlertCircle, { className: "w-4 h-4" }), _jsx("span", { children: formState.error })] })), formState.status === 'success' && (_jsxs("div", { className: "flex items-center gap-2 mt-2 text-sm text-green-600", children: [_jsx(CheckCircle2, { className: "w-4 h-4" }), _jsx("span", { children: "Thanks! We'll be in touch soon." })] }))] }), _jsx(Button, { type: "submit", size: "lg", disabled: formState.status === 'loading' || formState.status === 'success', isLoading: formState.status === 'loading', className: "w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700", children: formState.status === 'success' ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle2, { className: "mr-2 w-5 h-5" }), "Subscribed!"] })) : (_jsxs(_Fragment, { children: [buttonText, _jsx(ArrowRight, { className: "ml-2 w-5 h-5" })] })) })] }), showPrivacyNote && (_jsx("p", { className: "mt-4 text-xs text-center text-gray-500 dark:text-gray-400", children: "We respect your privacy. Unsubscribe at any time." }))] }));
};
/**
 * Inline Email Signup
 *
 * Compact horizontal layout for embedded use
 */
export var InlineEmailSignup = function (_a) {
    var _b = _a.placeholder, placeholder = _b === void 0 ? 'your@email.com' : _b, _c = _a.buttonText, buttonText = _c === void 0 ? 'Sign Up' : _c, _d = _a.type, type = _d === void 0 ? 'newsletter' : _d, onSubmit = _a.onSubmit, _e = _a.className, className = _e === void 0 ? '' : _e;
    var _f = useState({
        email: '',
        status: 'idle',
        error: null,
    }), formState = _f[0], setFormState = _f[1];
    var trackEvent = useAnalytics().trackEvent;
    var validateEmail = function (email) {
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!validateEmail(formState.email)) {
                        setFormState(function (prev) { return (__assign(__assign({}, prev), { error: 'Invalid email', status: 'error' })); });
                        return [2 /*return*/];
                    }
                    setFormState(function (prev) { return (__assign(__assign({}, prev), { status: 'loading' })); });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    if (!onSubmit) return [3 /*break*/, 3];
                    return [4 /*yield*/, onSubmit(formState.email, type)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    setFormState({ email: '', status: 'success', error: null });
                    trackEvent('form_submit', {
                        form_type: type,
                        location: 'inline_signup',
                    });
                    setTimeout(function () {
                        setFormState({ email: '', status: 'idle', error: null });
                    }, 2000);
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    setFormState(function (prev) { return (__assign(__assign({}, prev), { status: 'error', error: 'Failed to subscribe' })); });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs("form", { onSubmit: handleSubmit, className: "flex gap-2 ".concat(className), children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx(Input, { type: "email", value: formState.email, onChange: function (e) { return setFormState({ email: e.target.value, status: 'idle', error: null }); }, placeholder: placeholder, disabled: formState.status === 'loading' || formState.status === 'success', className: formState.error ? 'border-red-500' : '' }), formState.error && (_jsx("span", { className: "text-xs text-red-600 mt-1", children: formState.error }))] }), _jsx(Button, { type: "submit", disabled: formState.status === 'loading' || formState.status === 'success', isLoading: formState.status === 'loading', className: "whitespace-nowrap", children: formState.status === 'success' ? 'Done!' : buttonText })] }));
};
