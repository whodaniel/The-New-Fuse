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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useWizard } from '../WizardProvider';
export var UserProfileStep = function () {
    var _a, _b;
    var _c = useWizard(), state = _c.state, updateSessionData = _c.updateSessionData;
    var isAIAgent = ((_a = state.session) === null || _a === void 0 ? void 0 : _a.userType) === 'ai_agent';
    // Get existing data from session if available
    var existingData = ((_b = state.session) === null || _b === void 0 ? void 0 : _b.data) || {};
    // Form state
    var _d = useState({
        name: existingData.name || '',
        email: existingData.email || '',
        role: existingData.role || '',
        organization: existingData.organization || '',
        description: existingData.description || '',
        // AI agent specific fields
        agentType: existingData.agentType || 'general',
        apiVersion: existingData.apiVersion || '1.0',
        maintainer: existingData.maintainer || ''
    }), formData = _d[0], setFormData = _d[1];
    // Form validation
    var _e = useState({}), errors = _e[0], setErrors = _e[1];
    // Update session data when form changes
    useEffect(function () {
        updateSessionData(formData);
    }, [formData, updateSessionData]);
    var handleChange = function (e) {
        var _a = e.target, name = _a.name, value = _a.value;
        setFormData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[name] = value, _a)));
        });
        // Clear error when field is updated
        if (errors[name]) {
            setErrors(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[name] = '', _a)));
            });
        }
    };
    // Validate required fields
    var validateField = function (name, value) {
        if (!value.trim()) {
            setErrors(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[name] = 'This field is required', _a)));
            });
            return false;
        }
        return true;
    };
    // Validate email format
    var validateEmail = function (email) {
        if (!email.trim()) {
            setErrors(function (prev) { return (__assign(__assign({}, prev), { email: 'Email is required' })); });
            return false;
        }
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setErrors(function (prev) { return (__assign(__assign({}, prev), { email: 'Please enter a valid email address' })); });
            return false;
        }
        return true;
    };
    // Validate form on blur
    var handleBlur = function (e) {
        var _a = e.target, name = _a.name, value = _a.value;
        if (name === 'email') {
            validateEmail(value);
        }
        else if (name === 'name' || name === 'role' || (isAIAgent && name === 'agentType')) {
            validateField(name, value);
        }
    };
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: isAIAgent ? 'Agent Profile' : 'Your Profile' }), _jsx("p", { className: "mb-6 text-gray-600", children: isAIAgent
                    ? 'Please provide information about your AI agent to help us integrate it with The New Fuse platform.'
                    : 'Please provide some information about yourself to personalize your experience.' }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: [isAIAgent ? 'Agent Name' : 'Full Name', " ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { name: "name", value: formData.name, onChange: handleChange, onBlur: handleBlur, placeholder: isAIAgent ? 'e.g., Research Assistant Agent' : 'e.g., John Doe', className: "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ".concat(errors.name ? 'border-red-500' : 'border-gray-300') }), errors.name && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.name })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: [isAIAgent ? 'Contact Email' : 'Email Address', " ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { name: "email", type: "email", value: formData.email, onChange: handleChange, onBlur: handleBlur, placeholder: "e.g., user@example.com", className: "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ".concat(errors.email ? 'border-red-500' : 'border-gray-300') }), errors.email && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.email }), _jsx("p", { className: "text-gray-500 text-sm mt-1", children: isAIAgent
                                    ? 'Email address for the maintainer of this agent'
                                    : 'We\'ll never share your email with anyone else' })] }), isAIAgent ? (
                    // AI Agent specific fields
                    _jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["Agent Type ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("select", { name: "agentType", value: formData.agentType, onChange: handleChange, onBlur: handleBlur, "aria-label": "Agent Type", className: "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ".concat(errors.agentType ? 'border-red-500' : 'border-gray-300'), children: [_jsx("option", { value: "general", children: "General Purpose" }), _jsx("option", { value: "research", children: "Research Assistant" }), _jsx("option", { value: "coding", children: "Code Assistant" }), _jsx("option", { value: "creative", children: "Creative Assistant" }), _jsx("option", { value: "data", children: "Data Analysis" }), _jsx("option", { value: "custom", children: "Custom" })] }), errors.agentType && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.agentType })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "API Version" }), _jsxs("select", { name: "apiVersion", value: formData.apiVersion, onChange: handleChange, "aria-label": "API Version", className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "1.0", children: "1.0" }), _jsx("option", { value: "1.1", children: "1.1" }), _jsx("option", { value: "2.0", children: "2.0" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Maintainer" }), _jsx("input", { name: "maintainer", value: formData.maintainer, onChange: handleChange, placeholder: "e.g., OpenAI, Anthropic, or Individual Developer", className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] })) : (
                    // Human user specific fields
                    _jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Role" }), _jsxs("select", { name: "role", value: formData.role, onChange: handleChange, "aria-label": "Role", className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "Select your role" }), _jsx("option", { value: "developer", children: "Developer" }), _jsx("option", { value: "data_scientist", children: "Data Scientist" }), _jsx("option", { value: "product_manager", children: "Product Manager" }), _jsx("option", { value: "designer", children: "Designer" }), _jsx("option", { value: "researcher", children: "Researcher" }), _jsx("option", { value: "executive", children: "Executive" }), _jsx("option", { value: "other", children: "Other" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Organization" }), _jsx("input", { name: "organization", value: formData.organization, onChange: handleChange, placeholder: "e.g., Acme Inc.", className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] })), _jsx("hr", { className: "my-4 border-gray-200" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: isAIAgent ? 'Agent Description' : 'About You' }), _jsx("textarea", { name: "description", value: formData.description, onChange: handleChange, placeholder: isAIAgent
                                    ? 'Briefly describe your agent\'s purpose and capabilities...'
                                    : 'Tell us a bit about yourself and how you plan to use The New Fuse...', rows: 4, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] })] }));
};
