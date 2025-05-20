import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tabs,
  Tab,
  Chip
} from '@mui/material';
import {
  Delete,
  Block,
  VolumeOff,
  Warning,
  Add,
  Edit
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line
} from 'recharts';
import { format } from 'date-fns';
import axios from 'axios';

interface ModerationAction {
  id: string;
  type: 'ban' | 'mute' | 'warn';
  userId: string;
  reason: string;
  moderatorId: string;
  timestamp: string;
}

interface ModerationRule {
  id?: string;
  type: string;
  pattern?: string;
  keywords?: string[];
  action: 'warn' | 'delete' | 'mute' | 'ban';
  threshold?: number;
  isActive: boolean;
}

interface DashboardStats {
  totalActions: number;
  activeRules: number;
  bannedUsers: number;
  mutedUsers: number;
}

interface ActionTrend {
  date: string;
  warns: number;
  mutes: number;
  bans: number;
  deletes: number;
}

const ModerationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [recentActions, setRecentActions] = useState<ModerationAction[]>([]);
  const [rules, setRules] = useState<ModerationRule[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedRule, setSelectedRule] = useState<ModerationRule | null>(null);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [actionTrends, setActionTrends] = useState<ActionTrend[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [actionsRes, rulesRes, statsRes, trendsRes] = await Promise.all([
        axios.get<ModerationAction[]>('/api/moderation/actions'),
        axios.get<ModerationRule[]>('/api/moderation/rules'),
        axios.get<DashboardStats>('/api/moderation/stats'),
        axios.get<ActionTrend[]>('/api/moderation/trends')
      ]);

      setRecentActions(actionsRes.data);
      setRules(rulesRes.data);
      setStats(statsRes.data);
      setActionTrends(trendsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRuleEdit = (rule: ModerationRule) => {
    setSelectedRule(rule);
    setIsRuleDialogOpen(true);
  };

  const handleRuleSave = async (rule: ModerationRule) => {
    try {
      if (rule.id) {
        await axios.put(`/api/moderation/rules/${rule.id}`, rule);
      } else {
        await axios.post('/api/moderation/rules', rule);
      }
      fetchDashboardData();
      setIsRuleDialogOpen(false);
    } catch (error) {
      console.error('Error saving rule:', error);
    }
  };

  const renderOverview = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 2, height: '400px' }}>
          <Typography variant="h6" gutterBottom>
            Moderation Actions Trend
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={actionTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="warns" stroke="#ffc107" />
              <Line type="monotone" dataKey="mutes" stroke="#ff9800" />
              <Line type="monotone" dataKey="bans" stroke="#f44336" />
              <Line type="monotone" dataKey="deletes" stroke="#9c27b0" />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Actions
                </Typography>
                <Typography variant="h4">
                  {stats?.totalActions || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Rules
                </Typography>
                <Typography variant="h4">
                  {stats?.activeRules || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Banned Users
                </Typography>
                <Typography variant="h4">
                  {stats?.bannedUsers || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Muted Users
                </Typography>
                <Typography variant="h4">
                  {stats?.mutedUsers || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );

  const renderRecentActions = () => (
    <List>
      {recentActions.map((action) => (
        <ListItem
          key={action.id}
          secondaryAction={
            <IconButton edge="end" aria-label="delete">
              <Delete />
            </IconButton>
          }
        >
          <ListItemText
            primary={
              <Box display="flex" alignItems="center" gap={1}>
                {action.type === 'ban' && <Block color="error" />}
                {action.type === 'mute' && <VolumeOff color="warning" />}
                {action.type === 'warn' && <Warning color="info" />}
                <Typography>
                  {`${action.type.toUpperCase()} - User: ${action.userId}`}
                </Typography>
              </Box>
            }
            secondary={
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {`Reason: ${action.reason}`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {`By: ${action.moderatorId} at ${format(
                    new Date(action.timestamp),
                    'PPpp'
                  )}`}
                </Typography>
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );

  const renderRules = () => (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setSelectedRule(null);
            setIsRuleDialogOpen(true);
          }}
        >
          Add Rule
        </Button>
      </Box>
      <List>
        {rules.map((rule) => (
          <ListItem
            key={rule.id}
            secondaryAction={
              <IconButton edge="end" onClick={() => handleRuleEdit(rule)}>
                <Edit />
              </IconButton>
            }
          >
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography>{rule.type}</Typography>
                  <Chip
                    size="small"
                    label={rule.action}
                    color={
                      rule.action === 'ban'
                        ? 'error'
                        : rule.action === 'mute'
                        ? 'warning'
                        : 'default'
                    }
                  />
                  <Chip
                    size="small"
                    label={rule.isActive ? 'Active' : 'Inactive'}
                    color={rule.isActive ? 'success' : 'default'}
                  />
                </Box>
              }
              secondary={
                <Box>
                  {rule.pattern && (
                    <Typography variant="body2">
                      Pattern: {rule.pattern}
                    </Typography>
                  )}
                  {rule.keywords && (
                    <Typography variant="body2">
                      Keywords: {rule.keywords.join(', ')}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    Threshold: {rule.threshold}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Moderation Dashboard
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Recent Actions" />
          <Tab label="Rules" />
        </Tabs>
      </Box>

      {activeTab === 0 && renderOverview()}
      {activeTab === 1 && renderRecentActions()}
      {activeTab === 2 && renderRules()}

      <Dialog
        open={isRuleDialogOpen}
        onClose={() => setIsRuleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedRule ? 'Edit Rule' : 'Create Rule'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={selectedRule?.type || ''}
                label="Type"
                onChange={(e) =>
                  setSelectedRule((prev) =>
                    prev ? { ...prev, type: e.target.value } : null
                  )
                }
              >
                <MenuItem value="spam">Spam</MenuItem>
                <MenuItem value="profanity">Profanity</MenuItem>
                <MenuItem value="harassment">Harassment</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Pattern"
              sx={{ mb: 2 }}
              value={selectedRule?.pattern || ''}
              onChange={(e) =>
                setSelectedRule((prev) =>
                  prev ? { ...prev, pattern: e.target.value } : null
                )
              }
            />

            <TextField
              fullWidth
              label="Keywords (comma-separated)"
              sx={{ mb: 2 }}
              value={selectedRule?.keywords?.join(', ') || ''}
              onChange={(e) =>
                setSelectedRule((prev) =>
                  prev
                    ? {
                        ...prev,
                        keywords: e.target.value
                          .split(',')
                          .map((k) => k.trim())
                      }
                    : null
                )
              }
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Action</InputLabel>
              <Select
                value={selectedRule?.action || ''}
                label="Action"
                onChange={(e) =>
                  setSelectedRule((prev) =>
                    prev ? { ...prev, action: e.target.value } : null
                  )
                }
              >
                <MenuItem value="warn">Warn</MenuItem>
                <MenuItem value="delete">Delete</MenuItem>
                <MenuItem value="mute">Mute</MenuItem>
                <MenuItem value="ban">Ban</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsRuleDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => selectedRule && handleRuleSave(selectedRule)}
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModerationDashboard;