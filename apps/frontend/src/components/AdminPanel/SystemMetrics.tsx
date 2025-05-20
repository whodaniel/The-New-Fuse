import React from 'react';
import { Box, Grid, Stat, StatLabel, StatNumber, StatHelpText } from '@chakra-ui/react';
import { useSystemMetrics } from '../../hooks/useSystemMetrics.js';
import { ServiceMetrics } from '@the-new-fuse/types';

export const SystemMetrics: React.FC = () => {
  const { metrics, loading, error } = useSystemMetrics();

  if (loading) return <Box>Loading metrics...</Box>;
  if (error) return <Box>Error loading metrics</Box>;

  return (
    <Grid templateColumns="repeat(3, 1fr)" gap={6}>
      <MetricCard
        label="CPU Usage"
        value={`${metrics.cpuUsage.value}%`}
        helpText="Current CPU utilization"
      />
      <MetricCard
        label="Memory Usage"
        value={`${metrics.memoryUsage.value}MB`}
        helpText="Current memory usage"
      />
      <MetricCard
        label="Active Connections"
        value={metrics.activeConnections.value}
        helpText="Current active connections"
      />
      {/* Add more metric cards */}
    </Grid>
  );
};

const MetricCard: React.React.FC<{
  label: string;
  value: string | number;
  helpText: string;
}> = ({ label, value, helpText }) => (
  <Stat>
    <StatLabel>{label}</StatLabel>
    <StatNumber>{value}</StatNumber>
    <StatHelpText>{helpText}</StatHelpText>
  </Stat>
);
