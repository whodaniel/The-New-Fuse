import React, { useEffect, useState } from 'react';

import axios from 'axios';
import { format } from 'date-fns';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

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
        axios.get<ActionTrend[]>('/api/moderation/trends'),
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
    <SimpleGrid container columns={3}>
      <SimpleGrid item xs={12} md={8}>
        <Box sx={{ p: 2, height: '400px' }}>
          <Text variant="h6" gutterBottom>
            Moderation Actions Trend
          </Text>
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
        </Box>
      </SimpleGrid>
      <SimpleGrid item xs={12} md={4}>
        <SimpleGrid container columns={2}>
          <SimpleGrid item xs={6}>
            <Card>
              <CardBody>
                <Text color="textSecondary" gutterBottom>
                  Total Actions
                </Text>
                <Text variant="h4">{stats?.totalActions || 0}</Text>
              </CardBody>
            </Card>
          </SimpleGrid>
          <SimpleGrid item xs={6}>
            <Card>
              <CardBody>
                <Text color="textSecondary" gutterBottom>
                  Active Rules
                </Text>
                <Text variant="h4">{stats?.activeRules || 0}</Text>
              </CardBody>
            </Card>
          </SimpleGrid>
          <SimpleGrid item xs={6}>
            <Card>
              <CardBody>
                <Text color="textSecondary" gutterBottom>
                  Banned Users
                </Text>
                <Text variant="h4">{stats?.bannedUsers || 0}</Text>
              </CardBody>
            </Card>
          </SimpleGrid>
          <SimpleGrid item xs={6}>
            <Card>
              <CardBody>
                <Text color="textSecondary" gutterBottom>
                  Muted Users
                </Text>
                <Text variant="h4">{stats?.mutedUsers || 0}</Text>
              </CardBody>
            </Card>
          </SimpleGrid>
        </SimpleGrid>
      </SimpleGrid>
    </SimpleGrid>
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
          <ListItem
            primary={
              <Box display="flex" alignItems="center" gap={1}>
                {action.type === 'ban' && <Block color="error" />}
                {action.type === 'mute' && <VolumeOff color="warning" />}
                {action.type === 'warn' && <Warning color="info" />}
                <Text>{`${action.type.toUpperCase()} - User: ${action.userId}`}</Text>
              </Box>
            }
            secondary={
              <Box>
                <Text variant="body2" color="text.secondary">
                  {`Reason: ${action.reason}`}
                </Text>
                <Text variant="caption" color="text.secondary">
                  {`By: ${action.moderatorId} at ${format(new Date(action.timestamp), 'PPpp')}`}
                </Text>
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
            <ListItem
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Text>{rule.type}</Text>
                  <Tag
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
                  <Tag
                    size="small"
                    label={rule.isActive ? 'Active' : 'Inactive'}
                    color={rule.isActive ? 'success' : 'default'}
                  />
                </Box>
              }
              secondary={
                <Box>
                  {rule.pattern && <Text variant="body2">Pattern: {rule.pattern}</Text>}
                  {rule.keywords && (
                    <Text variant="body2">Keywords: {rule.keywords.join(', ')}</Text>
                  )}
                  <Text variant="body2">Threshold: {rule.threshold}</Text>
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
      <Text variant="h4" gutterBottom>
        Moderation Dashboard
      </Text>
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

      <Modal
        open={isRuleDialogOpen}
        onClose={() => setIsRuleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <ModalHeader>{selectedRule ? 'Edit Rule' : 'Create Rule'}</ModalHeader>
        <ModalBody>
          <Box component="form" sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={selectedRule?.type || ''}
                label="Type"
                onChange={(e) =>
                  setSelectedRule((prev) => (prev ? { ...prev, type: e.target.value } : null))
                }
              >
                <Option value="spam">Spam</Option>
                <Option value="profanity">Profanity</Option>
                <Option value="harassment">Harassment</Option>
                <Option value="custom">Custom</Option>
              </Select>
            </FormControl>

            <Input
              fullWidth
              label="Pattern"
              sx={{ mb: 2 }}
              value={selectedRule?.pattern || ''}
              onChange={(e) =>
                setSelectedRule((prev) => (prev ? { ...prev, pattern: e.target.value } : null))
              }
            />

            <Input
              fullWidth
              label="Keywords (comma-separated)"
              sx={{ mb: 2 }}
              value={selectedRule?.keywords?.join(', ') || ''}
              onChange={(e) =>
                setSelectedRule((prev) =>
                  prev
                    ? {
                        ...prev,
                        keywords: e.target.value.split(',').map((k) => k.trim()),
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
                  setSelectedRule((prev) => (prev ? { ...prev, action: e.target.value } : null))
                }
              >
                <Option value="warn">Warn</Option>
                <Option value="delete">Delete</Option>
                <Option value="mute">Mute</Option>
                <Option value="ban">Ban</Option>
              </Select>
            </FormControl>
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => setIsRuleDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => selectedRule && handleRuleSave(selectedRule)} variant="contained">
            Save
          </Button>
        </ModalFooter>
      </Modal>
    </Box>
  );
};

export default ModerationDashboard;
