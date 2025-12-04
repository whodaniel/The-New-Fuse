import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { OnboardingGeneralSettings } from './OnboardingGeneralSettings';
import { OnboardingStepsConfig } from './OnboardingStepsConfig';
import { OnboardingWizardPreview } from './OnboardingWizardPreview';
import { OnboardingAISettings } from './OnboardingAISettings';
import { OnboardingUserTypes } from './OnboardingUserTypes';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
export var OnboardingAdmin = function () {
    var _a = useState(0), activeTab = _a[0], setActiveTab = _a[1];
    var _b = useState(false), hasUnsavedChanges = _b[0], setHasUnsavedChanges = _b[1];
    var _c = useState(null), notification = _c[0], setNotification = _c[1];
    var showNotification = function (type, title, description) {
        setNotification({ type: type, title: title, description: description });
        setTimeout(function () { return setNotification(null); }, 5000);
    };
    // Handle tab change
    var handleTabChange = function (index) {
        if (hasUnsavedChanges) {
            var confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave this tab?');
            if (!confirmed) {
                return;
            }
        }
        setActiveTab(index);
        setHasUnsavedChanges(false);
    };
    // Handle save
    var handleSave = function () {
        // The actual save operation is handled by the individual components
        // This is just to update the parent component state
        showNotification('success', 'Settings saved', 'Your onboarding settings have been saved successfully.');
        setHasUnsavedChanges(false);
    };
    // Handle changes
    var handleChange = function () {
        setHasUnsavedChanges(true);
    };
    return (_jsxs("div", { className: "p-6", children: [notification && (_jsx("div", { className: "mb-4 p-4 rounded-md border ".concat(notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                    notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                        notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                            'bg-blue-50 border-blue-200 text-blue-800'), children: _jsxs("div", { className: "flex", children: [_jsxs("div", { className: "flex-shrink-0", children: [notification.type === 'success' && (_jsx(CheckCircle, { className: "h-5 w-5 text-green-400" })), notification.type === 'error' && (_jsx(XCircle, { className: "h-5 w-5 text-red-400" })), notification.type === 'warning' && (_jsx(AlertTriangle, { className: "h-5 w-5 text-yellow-400" })), notification.type === 'info' && (_jsx(Info, { className: "h-5 w-5 text-blue-400" }))] }), _jsxs("div", { className: "ml-3", children: [_jsx("h3", { className: "text-sm font-medium", children: notification.title }), notification.description && (_jsx("p", { className: "mt-1 text-sm", children: notification.description }))] })] }) })), _jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-6", children: "Onboarding Settings" }), _jsx("p", { className: "text-gray-600 mb-6", children: "Configure the onboarding experience for users and AI agents. These settings control how users and agents are onboarded to The New Fuse platform." }), hasUnsavedChanges && (_jsx("div", { className: "mb-4 p-4 rounded-md bg-yellow-50 border border-yellow-200", children: _jsxs("div", { className: "flex", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(AlertTriangle, { className: "h-5 w-5 text-yellow-400" }) }), _jsx("div", { className: "ml-3", children: _jsx("p", { className: "text-sm text-yellow-800", children: "You have unsaved changes. Make sure to save your changes before leaving this page." }) })] }) })), _jsxs("div", { className: "bg-white shadow rounded-lg", children: [_jsx("div", { className: "border-b border-gray-200", children: _jsx("nav", { className: "-mb-px flex space-x-8", "aria-label": "Tabs", children: [
                                { name: 'General', index: 0 },
                                { name: 'User Types', index: 1 },
                                { name: 'Wizard Steps', index: 2 },
                                { name: 'AI Settings', index: 3 },
                                { name: 'Preview', index: 4 }
                            ].map(function (tab) { return (_jsx("button", { onClick: function () { return handleTabChange(tab.index); }, className: "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ".concat(activeTab === tab.index
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'), children: tab.name }, tab.name)); }) }) }), _jsxs("div", { className: "p-6", children: [activeTab === 0 && (_jsx(OnboardingGeneralSettings, { onSave: handleSave, onChange: handleChange, hasUnsavedChanges: hasUnsavedChanges })), activeTab === 1 && (_jsx(OnboardingUserTypes, { onSave: handleSave, onChange: handleChange, hasUnsavedChanges: hasUnsavedChanges })), activeTab === 2 && (_jsx(OnboardingStepsConfig, { onSave: handleSave, onChange: handleChange, hasUnsavedChanges: hasUnsavedChanges })), activeTab === 3 && (_jsx(OnboardingAISettings, { onSave: handleSave, onChange: handleChange, hasUnsavedChanges: hasUnsavedChanges })), activeTab === 4 && (_jsx(OnboardingWizardPreview, {}))] })] })] }));
};
