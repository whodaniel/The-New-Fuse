import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Chip
} from '@mui/material';

interface PricingTiersProps {
  tiers: Record<string, any>;
}

export default function PricingTiers({ tiers }: PricingTiersProps) {
  if (!tiers) {
    return <Typography>No pricing tiers available</Typography>;
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(6)}`;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'BASIC':
        return '#4caf50'; // green
      case 'STANDARD':
        return '#2196f3'; // blue
      case 'PREMIUM':
        return '#ff9800'; // orange
      case 'ENTERPRISE':
        return '#9c27b0'; // purple
      default:
        return '#757575'; // grey
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {Object.entries(tiers).map(([tierName, tierData]: [string, any]) => (
          <Grid item xs={12} md={6} lg={3} key={tierName}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  backgroundColor: getTierColor(tierName),
                },
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  {tierName.charAt(0) + tierName.slice(1).toLowerCase()}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {tierName === 'BASIC'
                    ? 'For small projects and testing'
                    : tierName === 'STANDARD'
                    ? 'For medium-sized projects'
                    : tierName === 'PREMIUM'
                    ? 'For large projects with advanced needs'
                    : 'For enterprise-level requirements'}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <List dense sx={{ mb: 2, flexGrow: 1 }}>
                <ListItem>
                  <ListItemText
                    primary="Cost per second"
                    secondary={formatCurrency(tierData.costPerSecond)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Cost per MB"
                    secondary={formatCurrency(tierData.costPerMB)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Max execution time"
                    secondary={formatDuration(tierData.maxExecutionTime)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Max memory limit"
                    secondary={formatBytes(tierData.maxMemoryLimit)}
                  />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Allowed Modules
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {tierData.allowedModules.map((module: string) => (
                    <Chip
                      key={module}
                      label={module}
                      size="small"
                      sx={{ mb: 0.5 }}
                    />
                  ))}
                </Box>
              </Box>

              <Box sx={{ mt: 'auto', pt: 2 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ borderColor: getTierColor(tierName), color: getTierColor(tierName) }}
                >
                  Edit Tier
                </Button>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
