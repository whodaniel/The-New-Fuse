import React from 'react';
import { Box, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
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
