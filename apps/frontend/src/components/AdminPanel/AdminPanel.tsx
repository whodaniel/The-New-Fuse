import React, { useState } from 'react';
import { McpMonitor } from '../admin/McpMonitor'; // Import the new component
import { ApiMonitor } from './ApiMonitor';
import { AuditLogs } from './AuditLogs';
import { DatabaseAdmin } from './DatabaseAdmin';
import { FeatureFlags } from './FeatureFlags';
import { RoleManager } from './RoleManager';
import { ScriptRunner } from './ScriptRunner';
import { ServiceMonitor } from './ServiceMonitor';
import { SystemConfig } from './SystemConfig';
import { SystemMetrics } from './SystemMetrics';
import { UserManagement } from './UserManagement';

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
export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { label: 'Dashboard', component: <SystemMetrics /> },
    {
      label: 'Users & Roles',
      component: (
        <>
          <UserManagement />
          <RoleManager />
        </>
      ),
    },
    { label: 'Services', component: <ServiceMonitor /> },
    {
      label: 'Monitoring',
      component: (
        <>
          <ApiMonitor />
          <FeatureFlags />
        </>
      ),
    },
    { label: 'Configuration', component: <SystemConfig /> },
    { label: 'Scripts', component: <ScriptRunner /> },
    { label: 'Database', component: <DatabaseAdmin /> },
    { label: 'Audit', component: <AuditLogs /> },
    { label: 'MCP', component: <McpMonitor /> },
  ];

  return (
    <div className="p-4">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === index
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300 dark:text-muted-foreground dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-4">{tabs[activeTab].component}</div>
    </div>
  );
};
