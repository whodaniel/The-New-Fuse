import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ScriptRunner } from './ScriptRunner';
import { UserManagement } from './UserManagement';
import { SystemMetrics } from './SystemMetrics';
import { RoleManager } from './RoleManager';
import { ServiceMonitor } from './ServiceMonitor';
import { SystemConfig } from './SystemConfig';
import { AuditLogs } from './AuditLogs';
import { FeatureFlags } from './FeatureFlags';
import { ApiMonitor } from './ApiMonitor';
import { DatabaseAdmin } from './DatabaseAdmin';
import { McpMonitor } from './McpMonitor'; // Import the new component
/**
 * Admin Panel component that provides centralized access to all administrative functions.
 * Includes system monitoring, user management, service configuration, and more.
 *
 * @component
 * @example
 * ```tsx
 * <AdminPanel />
 * ```
 */
export var AdminPanel = function () {
    var _a = useState(0), activeTab = _a[0], setActiveTab = _a[1];
    var tabs = [
        { label: 'Dashboard', component: _jsx(SystemMetrics, {}) },
        { label: 'Users & Roles', component: _jsxs(_Fragment, { children: [_jsx(UserManagement, {}), _jsx(RoleManager, {})] }) },
        { label: 'Services', component: _jsx(ServiceMonitor, {}) },
        { label: 'Monitoring', component: _jsxs(_Fragment, { children: [_jsx(ApiMonitor, {}), _jsx(FeatureFlags, {})] }) },
        { label: 'Configuration', component: _jsx(SystemConfig, {}) },
        { label: 'Scripts', component: _jsx(ScriptRunner, {}) },
        { label: 'Database', component: _jsx(DatabaseAdmin, {}) },
        { label: 'Audit', component: _jsx(AuditLogs, {}) },
        { label: 'MCP', component: _jsx(McpMonitor, {}) }
    ];
    return (_jsxs("div", { className: "p-4", children: [_jsx("div", { className: "border-b border-gray-200 dark:border-gray-700", children: _jsx("nav", { className: "-mb-px flex space-x-8", children: tabs.map(function (tab, index) { return (_jsx("button", { onClick: function () { return setActiveTab(index); }, className: "py-2 px-1 border-b-2 font-medium text-sm ".concat(activeTab === index
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'), children: tab.label }, index)); }) }) }), _jsx("div", { className: "mt-4", children: tabs[activeTab].component })] }));
};
