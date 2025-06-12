import React from 'react';
import { Box, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import { ScriptRunner } from './ScriptRunner.tsx';
import { UserManagement } from './UserManagement.tsx';
import { SystemMetrics } from './SystemMetrics.tsx';
import { RoleManager } from './RoleManager.tsx';
import { ServiceMonitor } from './ServiceMonitor.tsx';
import { SystemConfig } from './SystemConfig.tsx';
import { AuditLogs } from './AuditLogs.tsx';
import { FeatureFlags } from './FeatureFlags.tsx';
import { ApiMonitor } from './ApiMonitor.tsx';
import { DatabaseAdmin } from './DatabaseAdmin.tsx';
import { McpMonitor } from './McpMonitor.js'; // Import the new component

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
  return (
    <Box p={4}>
      <Tabs>
        <TabList>
          <Tab>Dashboard</Tab>
          <Tab>Users & Roles</Tab>
          <Tab>Services</Tab>
          <Tab>Monitoring</Tab>
          <Tab>Configuration</Tab>
          <Tab>Scripts</Tab>
          <Tab>Database</Tab>
          <Tab>Audit</Tab>
          <Tab>MCP</Tab> {/* Add new tab */}
        </TabList>
        <TabPanels>
          <TabPanel>
            <SystemMetrics />
          </TabPanel>
          <TabPanel>
            <UserManagement />
            <RoleManager />
          </TabPanel>
          <TabPanel>
            <ServiceMonitor />
          </TabPanel>
          <TabPanel>
            <ApiMonitor />
          </TabPanel>
          <TabPanel>
            <SystemConfig />
            <FeatureFlags />
          </TabPanel>
          <TabPanel>
            <ScriptRunner />
          </TabPanel>
          <TabPanel>
            <DatabaseAdmin />
          </TabPanel>
          <TabPanel>
            <AuditLogs />
          </TabPanel>
          <TabPanel>
            <McpMonitor /> {/* Add new panel */}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};
