import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, Paper, CircularProgress } from '@mui/material';
import UsageStats from './UsageStats.js';
import SessionsList from './SessionsList.js';
import PricingTiers from './PricingTiers.js';
import SecurityLogs from './SecurityLogs.js';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`code-execution-tabpanel-${index}`}
      aria-labelledby={`code-execution-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `code-execution-tab-${index}`,
    'aria-controls': `code-execution-tabpanel-${index}`,
  };
}

export default function CodeExecutionDashboard() {
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>({
    usageStats: null,
    sessions: [],
    pricingTiers: null,
    securityLogs: [],
  });

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // In a real implementation, these would be actual API calls
        // For now, we'll just simulate the data

        // Fetch usage stats
        const usageStats = {
          totalExecutions: 1245,
          totalCost: 123.45,
          totalComputeUnits: 2468.9,
          averageExecutionTime: 1200, // ms
          averageMemoryUsage: 25 * 1024 * 1024, // 25MB
          languageCounts: [
            { language: 'JAVASCRIPT', count: 789 },
            { language: 'TYPESCRIPT', count: 321 },
            { language: 'PYTHON', count: 135 },
          ],
          tierCounts: [
            { tier: 'BASIC', count: 956, cost: 45.67 },
            { tier: 'STANDARD', count: 234, cost: 56.78 },
            { tier: 'PREMIUM', count: 55, cost: 21.00 },
          ],
          statusCounts: [
            { status: 'COMPLETED', count: 1156 },
            { status: 'FAILED', count: 67 },
            { status: 'TIMEOUT', count: 22 },
          ],
        };

        // Fetch sessions
        const sessions = [
          {
            id: '1',
            name: 'JavaScript Playground',
            ownerId: 'user1',
            collaborators: ['user2', 'user3'],
            isPublic: true,
            files: [
              { id: '1', name: 'main.js', language: 'javascript' },
              { id: '2', name: 'utils.js', language: 'javascript' },
            ],
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-02T00:00:00.000Z',
          },
          {
            id: '2',
            name: 'Python Data Analysis',
            ownerId: 'user2',
            collaborators: ['user1'],
            isPublic: false,
            files: [
              { id: '3', name: 'analysis.py', language: 'python' },
              { id: '4', name: 'data.py', language: 'python' },
            ],
            createdAt: '2023-01-03T00:00:00.000Z',
            updatedAt: '2023-01-04T00:00:00.000Z',
          },
        ];

        // Fetch pricing tiers
        const pricingTiers = {
          BASIC: {
            costPerSecond: 0.0001,
            costPerMB: 0.00001,
            maxExecutionTime: 10000,
            maxMemoryLimit: 128 * 1024 * 1024,
            allowedModules: ['path', 'util', 'crypto'],
          },
          STANDARD: {
            costPerSecond: 0.0005,
            costPerMB: 0.00005,
            maxExecutionTime: 30000,
            maxMemoryLimit: 256 * 1024 * 1024,
            allowedModules: ['path', 'util', 'crypto', 'fs', 'http', 'https', 'zlib'],
          },
          PREMIUM: {
            costPerSecond: 0.001,
            costPerMB: 0.0001,
            maxExecutionTime: 60000,
            maxMemoryLimit: 512 * 1024 * 1024,
            allowedModules: ['path', 'util', 'crypto', 'fs', 'http', 'https', 'zlib', 'stream', 'child_process'],
          },
          ENTERPRISE: {
            costPerSecond: 0.002,
            costPerMB: 0.0002,
            maxExecutionTime: 300000,
            maxMemoryLimit: 1024 * 1024 * 1024,
            allowedModules: ['*'],
          },
        };

        // Fetch security logs
        const securityLogs = [
          {
            id: '1',
            timestamp: '2023-01-01T00:00:00.000Z',
            clientId: 'user1',
            action: 'SECURITY_SCAN',
            result: 'BLOCKED',
            details: 'Attempt to use eval() function',
            severity: 'HIGH',
          },
          {
            id: '2',
            timestamp: '2023-01-02T00:00:00.000Z',
            clientId: 'user2',
            action: 'RATE_LIMIT',
            result: 'BLOCKED',
            details: 'Rate limit exceeded: 10 requests per minute',
            severity: 'MEDIUM',
          },
          {
            id: '3',
            timestamp: '2023-01-03T00:00:00.000Z',
            clientId: 'user3',
            action: 'SECURITY_SCAN',
            result: 'ALLOWED',
            details: 'Code passed security scan',
            severity: 'LOW',
          },
        ];

        setData({
          usageStats,
          sessions,
          pricingTiers,
          securityLogs,
        });
      } catch (err) {
        setError('Failed to fetch data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Code Execution Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor and manage code execution across the platform
        </Typography>
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="code execution dashboard tabs">
          <Tab label="Usage Statistics" {...a11yProps(0)} />
          <Tab label="Sessions" {...a11yProps(1)} />
          <Tab label="Pricing Tiers" {...a11yProps(2)} />
          <Tab label="Security Logs" {...a11yProps(3)} />
        </Tabs>
      </Box>

      <TabPanel value={value} index={0}>
        <UsageStats data={data.usageStats} />
      </TabPanel>

      <TabPanel value={value} index={1}>
        <SessionsList sessions={data.sessions} />
      </TabPanel>

      <TabPanel value={value} index={2}>
        <PricingTiers tiers={data.pricingTiers} />
      </TabPanel>

      <TabPanel value={value} index={3}>
        <SecurityLogs logs={data.securityLogs} />
      </TabPanel>
    </Box>
  );
}
