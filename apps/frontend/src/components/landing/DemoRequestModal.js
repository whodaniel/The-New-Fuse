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
import { X, Calendar, Users, Mail, Building2, Phone } from 'lucide-react';
import { Dialog, DialogTitle, DialogDescription } from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useAnalytics } from '../../hooks/useAnalytics';
/**
 * Demo Request Modal Component
 *
 * Features:
 * - Multi-field form with validation
 * - Required and optional fields
 * - Loading states
 * - Success feedback
 * - Analytics tracking
 * - Responsive design
 */
export var DemoRequestModal = function (_a) {
    var isOpen = _a.isOpen, onClose = _a.onClose, onSubmit = _a.onSubmit;
    var _b = useState({
        name: '',
        email: '',
        company: '',
        phone: '',
        teamSize: '',
        message: '',
    }), formData = _b[0], setFormData = _b[1];
    var _c = useState({}), errors = _c[0], setErrors = _c[1];
    var _d = useState(false), isSubmitting = _d[0], setIsSubmitting = _d[1];
    var _e = useState(false), isSuccess = _e[0], setIsSuccess = _e[1];
    var trackEvent = useAnalytics().trackEvent;
    var validateForm = function () {
        var newErrors = {};
        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }
        // Email validation
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        }
        else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        // Company validation
        if (!formData.company.trim()) {
            newErrors.company = 'Company name is required';
        }
        // Phone validation (optional, but validate format if provided)
        if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
            newErrors.phone = 'Please enter a valid phone number';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!validateForm()) {
                        trackEvent('form_error', {
                            form_type: 'demo_request',
                            errors: Object.keys(errors),
                        });
                        return [2 /*return*/];
                    }
                    setIsSubmitting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    if (!onSubmit) return [3 /*break*/, 3];
                    return [4 /*yield*/, onSubmit(formData)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    setIsSuccess(true);
                    trackEvent('form_submit', {
                        form_type: 'demo_request',
                        team_size: formData.teamSize,
                    });
                    // Reset form after 2 seconds and close modal
                    setTimeout(function () {
                        setFormData({
                            name: '',
                            email: '',
                            company: '',
                            phone: '',
                            teamSize: '',
                            message: '',
                        });
                        setIsSuccess(false);
                        onClose();
                    }, 2000);
                    return [3 /*break*/, 6];
                case 4:
                    error_1 = _a.sent();
                    setErrors({ submit: 'Failed to submit request. Please try again.' });
                    trackEvent('form_error', {
                        form_type: 'demo_request',
                        error: 'submission_failed',
                    });
                    return [3 /*break*/, 6];
                case 5:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleChange = function (field) { return function (e) {
        setFormData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[field] = e.target.value, _a)));
        });
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(function (prev) {
                var newErrors = __assign({}, prev);
                delete newErrors[field];
                return newErrors;
            });
        }
    }; };
    var handleClose = function () {
        if (!isSubmitting) {
            trackEvent('modal_close', {
                modal_type: 'demo_request',
                had_input: Object.values(formData).some(function (v) { return v.trim() !== ''; }),
            });
            onClose();
        }
    };
    return (_jsx(Dialog, { open: isOpen, onOpenChange: handleClose, children: _jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx(DialogTitle, { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Request a Demo" }), _jsx(DialogDescription, { className: "mt-2 text-gray-600 dark:text-gray-400", children: "See how The New Fuse can transform your workflow. We'll schedule a personalized demo for your team." })] }), _jsx("button", { onClick: handleClose, disabled: isSubmitting, className: "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors", "aria-label": "Close modal", children: _jsx(X, { className: "w-6 h-6" }) })] }), isSuccess ? (_jsxs("div", { className: "p-8 text-center", children: [_jsx("div", { className: "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Calendar, { className: "w-8 h-8 text-green-600" }) }), _jsx("h3", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-2", children: "Request Received!" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Thank you for your interest. We'll reach out within 24 hours to schedule your demo." })] })) : (
                    /* Form */
                    _jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Full Name *" }), _jsxs("div", { className: "relative", children: [_jsx(Users, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" }), _jsx(Input, { id: "name", type: "text", value: formData.name, onChange: handleChange('name'), placeholder: "John Doe", className: "pl-10 ".concat(errors.name ? 'border-red-500' : ''), disabled: isSubmitting })] }), errors.name && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.name }))] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Work Email *" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" }), _jsx(Input, { id: "email", type: "email", value: formData.email, onChange: handleChange('email'), placeholder: "john@company.com", className: "pl-10 ".concat(errors.email ? 'border-red-500' : ''), disabled: isSubmitting })] }), errors.email && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.email }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "company", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Company *" }), _jsxs("div", { className: "relative", children: [_jsx(Building2, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" }), _jsx(Input, { id: "company", type: "text", value: formData.company, onChange: handleChange('company'), placeholder: "Acme Inc.", className: "pl-10 ".concat(errors.company ? 'border-red-500' : ''), disabled: isSubmitting })] }), errors.company && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.company }))] })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "phone", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Phone Number" }), _jsxs("div", { className: "relative", children: [_jsx(Phone, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" }), _jsx(Input, { id: "phone", type: "tel", value: formData.phone, onChange: handleChange('phone'), placeholder: "+1 (555) 000-0000", className: "pl-10 ".concat(errors.phone ? 'border-red-500' : ''), disabled: isSubmitting })] }), errors.phone && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.phone }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "teamSize", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Team Size" }), _jsxs("select", { id: "teamSize", value: formData.teamSize, onChange: handleChange('teamSize'), className: "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white", disabled: isSubmitting, children: [_jsx("option", { value: "", children: "Select size" }), _jsx("option", { value: "1-10", children: "1-10 employees" }), _jsx("option", { value: "11-50", children: "11-50 employees" }), _jsx("option", { value: "51-200", children: "51-200 employees" }), _jsx("option", { value: "201-1000", children: "201-1000 employees" }), _jsx("option", { value: "1000+", children: "1000+ employees" })] })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "message", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "What are you looking to achieve? (Optional)" }), _jsx("textarea", { id: "message", value: formData.message, onChange: handleChange('message'), placeholder: "Tell us about your use case...", rows: 4, className: "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white", disabled: isSubmitting })] }), errors.submit && (_jsx("div", { className: "p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md", children: _jsx("p", { className: "text-sm text-red-600 dark:text-red-400", children: errors.submit }) })), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3 pt-4", children: [_jsx(Button, { type: "button", variant: "outline", onClick: handleClose, disabled: isSubmitting, className: "sm:flex-1", children: "Cancel" }), _jsx(Button, { type: "submit", disabled: isSubmitting, isLoading: isSubmitting, className: "sm:flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700", children: isSubmitting ? 'Submitting...' : 'Request Demo' })] }), _jsx("p", { className: "text-xs text-center text-gray-500 dark:text-gray-400", children: "By submitting this form, you agree to our privacy policy and terms of service." })] }))] }) }) }));
};
/**
 * Demo Request Button
 *
 * Convenience component that includes the button and modal
 */
export var DemoRequestButton = function (_a) {
    var _b = _a.buttonText, buttonText = _b === void 0 ? 'Request Demo' : _b, _c = _a.variant, variant = _c === void 0 ? 'outline' : _c, _d = _a.size, size = _d === void 0 ? 'default' : _d, onSubmit = _a.onSubmit, _e = _a.className, className = _e === void 0 ? '' : _e;
    var _f = useState(false), isOpen = _f[0], setIsOpen = _f[1];
    var trackEvent = useAnalytics().trackEvent;
    var handleOpen = function () {
        setIsOpen(true);
        trackEvent('modal_open', {
            modal_type: 'demo_request',
            trigger: 'button_click',
        });
    };
    return (_jsxs(_Fragment, { children: [_jsxs(Button, { variant: variant, size: size, onClick: handleOpen, className: className, children: [_jsx(Calendar, { className: "mr-2 w-4 h-4" }), buttonText] }), _jsx(DemoRequestModal, { isOpen: isOpen, onClose: function () { return setIsOpen(false); }, onSubmit: onSubmit })] }));
};
