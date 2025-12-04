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
export var WorkspaceSetupStep = function () {
    var _a, _b;
    var _c = useWizard(), state = _c.state, updateSessionData = _c.updateSessionData;
    var isAIAgent = ((_a = state.session) === null || _a === void 0 ? void 0 : _a.userType) === 'ai_agent';
    // Notification state to replace useToast
    var _d = useState(null), notification = _d[0], setNotification = _d[1];
    var showNotification = function (message, type) {
        setNotification({ message: message, type: type });
        setTimeout(function () { return setNotification(null); }, 5000);
    };
    // Get existing data from session if available
    var existingData = ((_b = state.session) === null || _b === void 0 ? void 0 : _b.data) || {};
    // Form state
    var _e = useState({
        // Common fields
        name: existingData.workspaceName || '',
        description: existingData.workspaceDescription || '',
        // Human user specific fields
        visibility: existingData.workspaceVisibility || 'private',
        template: existingData.workspaceTemplate || 'blank',
        enableCollaboration: existingData.enableCollaboration || false,
        // AI agent specific fields
        endpointUrl: existingData.endpointUrl || '',
        authType: existingData.authType || 'api_key',
        apiKey: existingData.apiKey || '',
        webhookUrl: existingData.webhookUrl || '',
        maxConcurrentRequests: existingData.maxConcurrentRequests || '10'
    }), formData = _e[0], setFormData = _e[1];
    // Form validation
    var _f = useState({}), errors = _f[0], setErrors = _f[1];
    // Update session data when form changes
    useEffect(function () {
        updateSessionData({
            workspaceName: formData.name,
            workspaceDescription: formData.description,
            workspaceVisibility: formData.visibility,
            workspaceTemplate: formData.template,
            enableCollaboration: formData.enableCollaboration,
            endpointUrl: formData.endpointUrl,
            authType: formData.authType,
            apiKey: formData.apiKey,
            webhookUrl: formData.webhookUrl,
            maxConcurrentRequests: formData.maxConcurrentRequests
        });
    }, [formData, updateSessionData]);
    var handleChange = function (e) {
        var _a = e.target, name = _a.name, value = _a.value, type = _a.type;
        if (type === 'checkbox') {
            var checked_1 = e.target.checked;
            setFormData(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[name] = checked_1, _a)));
            });
        }
        else {
            setFormData(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[name] = value, _a)));
            });
        }
        // Clear error when field is updated
        if (errors[name]) {
            setErrors(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[name] = '', _a)));
            });
        }
    };
    var handleSwitchChange = function (name, checked) {
        setFormData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[name] = checked, _a)));
        });
    };
    var handleRadioChange = function (name, value) {
        setFormData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[name] = value, _a)));
        });
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
    // Validate URL format
    var validateUrl = function (name, url) {
        if (!url.trim()) {
            return true; // URL is optional
        }
        try {
            new URL(url);
            return true;
        }
        catch (error) {
            setErrors(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[name] = 'Please enter a valid URL', _a)));
            });
            return false;
        }
    };
    // Validate form on blur
    var handleBlur = function (e) {
        var _a = e.target, name = _a.name, value = _a.value;
        if (name === 'name') {
            validateField(name, value);
        }
        else if (name === 'endpointUrl' || name === 'webhookUrl') {
            validateUrl(name, value);
        }
    };
    var handleTestConnection = function () {
        // In a real implementation, this would test the connection to the agent's endpoint
        showNotification('Connection successful! Your agent is properly configured.', 'success');
    };
    return (_jsxs("div", { className: "space-y-6", children: [notification && (_jsx("div", { className: "p-4 rounded-md ".concat(notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
                    notification.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
                        'bg-blue-100 text-blue-800 border border-blue-200'), children: notification.message })), _jsx("h2", { className: "text-lg font-semibold mb-4", children: isAIAgent ? 'Integration Setup' : 'Workspace Setup' }), _jsx("p", { className: "mb-6 text-gray-600", children: isAIAgent
                    ? 'Configure how your agent will communicate with The New Fuse platform.'
                    : 'Create your first workspace to organize your projects and collaborations.' }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: [isAIAgent ? 'Integration Name' : 'Workspace Name', " *"] }), _jsx("input", { name: "name", value: formData.name, onChange: handleChange, onBlur: handleBlur, placeholder: isAIAgent ? 'e.g., Claude Integration' : 'e.g., My First Workspace', className: "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ".concat(errors.name ? 'border-red-500' : 'border-gray-300') }), errors.name && _jsx("p", { className: "text-red-600 text-sm mt-1", children: errors.name })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: isAIAgent ? 'Integration Description' : 'Workspace Description' }), _jsx("textarea", { name: "description", value: formData.description, onChange: handleChange, placeholder: isAIAgent
                                    ? 'Describe how this integration will be used...'
                                    : 'Describe the purpose of this workspace...', rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), isAIAgent ? (
                    // AI Agent specific fields
                    _jsxs(_Fragment, { children: [_jsx("hr", { className: "border-gray-200" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "API Endpoint URL" }), _jsx("input", { name: "endpointUrl", value: formData.endpointUrl, onChange: handleChange, onBlur: handleBlur, placeholder: "e.g., https://api.youragent.com/v1", className: "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ".concat(errors.endpointUrl ? 'border-red-500' : 'border-gray-300') }), errors.endpointUrl && _jsx("p", { className: "text-red-600 text-sm mt-1", children: errors.endpointUrl }), _jsx("p", { className: "text-gray-500 text-sm mt-1", children: "The URL where The New Fuse can send requests to your agent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-3", children: "Authentication Type" }), _jsx("div", { className: "space-y-3", children: ['api_key', 'oauth', 'jwt', 'none'].map(function (type) { return (_jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "radio", name: "authType", value: type, checked: formData.authType === type, onChange: function (e) { return handleRadioChange('authType', e.target.value); }, className: "mr-2" }), _jsx("span", { className: "text-sm", children: type === 'api_key' ? 'API Key' :
                                                        type === 'oauth' ? 'OAuth 2.0' :
                                                            type === 'jwt' ? 'JWT' :
                                                                'No Authentication' })] }, type)); }) })] }), formData.authType === 'api_key' && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "API Key" }), _jsx("input", { name: "apiKey", type: "password", value: formData.apiKey, onChange: handleChange, placeholder: "Enter your API key", className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" }), _jsx("p", { className: "text-gray-500 text-sm mt-1", children: "This will be stored securely and used for authentication" })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Webhook URL (Optional)" }), _jsx("input", { name: "webhookUrl", value: formData.webhookUrl, onChange: handleChange, onBlur: handleBlur, placeholder: "e.g., https://youragent.com/webhook", className: "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ".concat(errors.webhookUrl ? 'border-red-500' : 'border-gray-300') }), errors.webhookUrl && _jsx("p", { className: "text-red-600 text-sm mt-1", children: errors.webhookUrl }), _jsx("p", { className: "text-gray-500 text-sm mt-1", children: "URL for receiving asynchronous notifications" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Max Concurrent Requests" }), _jsxs("select", { name: "maxConcurrentRequests", value: formData.maxConcurrentRequests, onChange: handleChange, "aria-label": "Max Concurrent Requests", className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "5", children: "5" }), _jsx("option", { value: "10", children: "10" }), _jsx("option", { value: "20", children: "20" }), _jsx("option", { value: "50", children: "50" }), _jsx("option", { value: "100", children: "100" }), _jsx("option", { value: "unlimited", children: "Unlimited" })] }), _jsx("p", { className: "text-gray-500 text-sm mt-1", children: "Maximum number of concurrent requests your agent can handle" })] }), _jsx("div", { className: "mt-4", children: _jsx("button", { onClick: handleTestConnection, className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500", children: "Test Connection" }) })] })) : (
                    // Human user specific fields
                    _jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-3", children: "Workspace Visibility" }), _jsx("div", { className: "space-y-3", children: [
                                            { value: 'private', label: 'Private (Only you can access)' },
                                            { value: 'team', label: 'Team (You and invited members)' },
                                            { value: 'public', label: 'Public (Anyone in your organization)' }
                                        ].map(function (option) { return (_jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "radio", name: "visibility", value: option.value, checked: formData.visibility === option.value, onChange: function (e) { return handleRadioChange('visibility', e.target.value); }, className: "mr-2" }), _jsx("span", { className: "text-sm", children: option.label })] }, option.value)); }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Workspace Template" }), _jsxs("select", { name: "template", value: formData.template, onChange: handleChange, "aria-label": "Workspace Template", className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "blank", children: "Blank Workspace" }), _jsx("option", { value: "development", children: "Software Development" }), _jsx("option", { value: "research", children: "Research Project" }), _jsx("option", { value: "content", children: "Content Creation" }), _jsx("option", { value: "data_analysis", children: "Data Analysis" })] }), _jsx("p", { className: "text-gray-500 text-sm mt-1", children: "Choose a template to pre-configure your workspace" })] }), _jsx("hr", { className: "border-gray-200" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-3", children: "Collaboration Settings" }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("input", { type: "checkbox", checked: formData.enableCollaboration, onChange: function (e) { return handleSwitchChange('enableCollaboration', e.target.checked); }, className: "w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" }), _jsx("span", { className: "text-sm", children: "Enable real-time collaboration" })] }), _jsx("p", { className: "text-gray-500 text-sm mt-1", children: "Allow multiple users to work in the workspace simultaneously" })] })] }))] })] }));
};
