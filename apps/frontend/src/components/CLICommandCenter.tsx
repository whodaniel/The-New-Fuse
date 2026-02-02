/**
 * CLI Command Center Component
 *
 * A comprehensive UI component for executing TNF CLI commands from the frontend.
 * Demonstrates the use of the useCLICommands hook.
 *
 * @module CLICommandCenter
 */

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import {
  CLIAgentInfo,
  CLICategory,
  CLICommandInfo,
  CLITaskInfo,
  CLIWorkflowTemplate,
  useCLICommands,
} from '../hooks/useCLICommands';

/**
 * IDE Command Category Info
 */
interface IDECommandCategory {
  id: string;
  name: string;
  description: string;
  commands: string[];
}

/**
 * IDE Command Categories
 */
const IDE_COMMAND_CATEGORIES: IDECommandCategory[] = [
  {
    id: 'chat',
    name: 'Chat',
    description: 'Chat and messaging commands',
    commands: [
      'sendMessage',
      'newChat',
      'clearChat',
      'historyButtonClicked',
      'openInNewTab',
      'attachFiles',
    ],
  },
  {
    id: 'codeActions',
    name: 'Code Actions',
    description: 'Code manipulation and analysis',
    commands: [
      'explainCode',
      'fixCode',
      'improveCode',
      'codeActions',
      'codeLens.explain',
      'codeLens.optimize',
      'codeLens.generateTests',
      'codeLens.document',
    ],
  },
  {
    id: 'aiFeatures',
    name: 'AI Features',
    description: 'AI-powered features',
    commands: [
      'inlineSuggestions',
      'completion.toggle',
      'completion.clearCache',
      'completion.triggerManual',
      'hover.explain',
      'hover.toggleAIHints',
    ],
  },
  {
    id: 'mcp',
    name: 'MCP',
    description: 'Model Context Protocol commands',
    commands: ['mcpConnect', 'mcpStatus', 'mcpImportConfig', 'mcpExportConfig', 'mcpMarketplace'],
  },
  {
    id: 'browser',
    name: 'Browser',
    description: 'Browser automation commands',
    commands: ['openBrowser', 'navigateTo', 'browserScreenshot', 'browserExecuteScript'],
  },
  {
    id: 'workflow',
    name: 'Workflow',
    description: 'Workflow and planning commands',
    commands: ['openWorkflowBuilder', 'planManager', 'agentFederation'],
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Security-related commands',
    commands: ['securityDashboard', 'securityScan', 'emergencyMode'],
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Configuration and settings',
    commands: [
      'settingsButtonClicked',
      'profileButtonClicked',
      'openLiteLLMConfig',
      'selectModel',
      'selectOpenRouterModel',
    ],
  },
  {
    id: 'system',
    name: 'System',
    description: 'System management commands',
    commands: ['systemStatus', 'autoApprove', 'codeMode', 'databaseMode', 'terminalOrchestration'],
  },
  {
    id: 'workspace',
    name: 'Workspace',
    description: 'Workspace and Git commands',
    commands: ['workspace.index', 'workspace.searchSymbols', 'git.summary', 'addToContext'],
  },
  {
    id: 'cli',
    name: 'CLI',
    description: 'CLI integration commands',
    commands: [
      'cli.runAgent',
      'cli.initWorkspace',
      'cli.showTasks',
      'cli.showHistory',
      'cli.chatSession',
    ],
  },
];

/**
 * Tab panel component
 */
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
      id={`cli-tabpanel-${index}`}
      aria-labelledby={`cli-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * CLI Command Center Component
 *
 * Provides a UI for:
 * - Executing CLI commands by category (agent, task, workflow, config, monitoring, ide)
 * - Viewing command output and results
 * - Managing agents and tasks
 * - Executing workflows
 * - Monitoring system health
 * - Executing IDE commands
 *
 * @example
 * ```tsx
 * <CLICommandCenter />
 * ```
 */
export function CLICommandCenter(): React.ReactElement {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<CLICategory>('agent');
  const [selectedCommand, setSelectedCommand] = useState<string>('');
  const [commandArgs, setCommandArgs] = useState<Record<string, string>>({});
  const [commandOptions, setCommandOptions] = useState<Record<string, string>>({});
  const [output, setOutput] = useState<string>('');
  const [commands, setCommands] = useState<CLICommandInfo[]>([]);
  const [agents, setAgents] = useState<CLIAgentInfo[]>([]);
  const [tasks, setTasks] = useState<CLITaskInfo[]>([]);
  const [templates, setTemplates] = useState<CLIWorkflowTemplate[]>([]);
  const [ideOutput, setIdeOutput] = useState<string>('');
  const [expandedCategory, setExpandedCategory] = useState<string | false>('chat');

  const {
    executeCommand,
    executeIDECommand,
    getCommands,
    listAgents,
    listTasks,
    listWorkflowTemplates,
    loading,
    error,
    lastResult,
  } = useCLICommands();

  // Load commands on mount
  useEffect(() => {
    loadCommands();
    loadAgents();
    loadTasks();
    loadTemplates();
  }, []);

  const loadCommands = useCallback(async () => {
    const cmds = await getCommands();
    setCommands(cmds);
  }, [getCommands]);

  const loadAgents = useCallback(async () => {
    const agentList = await listAgents();
    setAgents(agentList);
  }, [listAgents]);

  const loadTasks = useCallback(async () => {
    const taskList = await listTasks();
    setTasks(taskList);
  }, [listTasks]);

  const loadTemplates = useCallback(async () => {
    const templateList = await listWorkflowTemplates();
    setTemplates(templateList);
  }, [listWorkflowTemplates]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleExecuteCommand = async () => {
    if (!selectedCommand) {
      setOutput('Please select a command');
      return;
    }

    const result = await executeCommand({
      category: selectedCategory,
      command: selectedCommand,
      args: commandArgs,
      options: commandOptions,
    });

    if (result) {
      setOutput(JSON.stringify(result.data, null, 2));
    }
  };

  const handleExecuteIDECommand = async (command: string) => {
    setIdeOutput(`Executing: ${command}...\n`);

    const result = await executeIDECommand(command);

    if (result) {
      setIdeOutput((prev) => prev + JSON.stringify(result.data, null, 2));
    } else {
      setIdeOutput((prev) => prev + 'Command failed or returned no data.');
    }
  };

  const handleCategoryChange = (category: string) => {
    setExpandedCategory(expandedCategory === category ? false : category);
  };

  const filteredCommands = commands.filter((cmd) => cmd.category === selectedCategory);

  const selectedCommandInfo = commands.find(
    (cmd) => cmd.name === selectedCommand && cmd.category === selectedCategory
  );

  // ============================================================================
  // Render Methods
  // ============================================================================

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        CLI Command Center
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        aria-label="CLI Command Categories"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Command Builder" />
        <Tab label="Agents" />
        <Tab label="Tasks" />
        <Tab label="Workflows" />
        <Tab label="Monitoring" />
        <Tab label="IDE Commands" />
      </Tabs>

      {/* Command Builder Tab */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardHeader title="Build Command" />
              <CardContent>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    label="Category"
                    onChange={(e) => {
                      setSelectedCategory(e.target.value as CLICategory);
                      setSelectedCommand('');
                      setCommandArgs({});
                      setCommandOptions({});
                    }}
                    disabled={loading}
                  >
                    <MenuItem value="agent">Agent</MenuItem>
                    <MenuItem value="task">Task</MenuItem>
                    <MenuItem value="workflow">Workflow</MenuItem>
                    <MenuItem value="config">Config</MenuItem>
                    <MenuItem value="monitoring">Monitoring</MenuItem>
                    <MenuItem value="message">Message</MenuItem>
                    <MenuItem value="conversation">Conversation</MenuItem>
                    <MenuItem value="ide">IDE</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Command</InputLabel>
                  <Select
                    value={selectedCommand}
                    label="Command"
                    onChange={(e) => {
                      setSelectedCommand(e.target.value);
                      setCommandArgs({});
                      setCommandOptions({});
                    }}
                    disabled={loading}
                  >
                    {filteredCommands.map((cmd) => (
                      <MenuItem key={cmd.id} value={cmd.name}>
                        {cmd.name} - {cmd.description}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedCommandInfo?.args?.map((arg) => (
                  <TextField
                    key={arg.name}
                    fullWidth
                    label={arg.name}
                    placeholder={arg.description}
                    required={arg.required}
                    value={commandArgs[arg.name] || ''}
                    onChange={(e) =>
                      setCommandArgs((prev) => ({ ...prev, [arg.name]: e.target.value }))
                    }
                    sx={{ mb: 2 }}
                    disabled={loading}
                  />
                ))}

                {selectedCommandInfo?.options?.map((opt) => (
                  <TextField
                    key={opt.name}
                    fullWidth
                    label={opt.name}
                    placeholder={opt.description}
                    value={commandOptions[opt.name] || ''}
                    onChange={(e) =>
                      setCommandOptions((prev) => ({ ...prev, [opt.name]: e.target.value }))
                    }
                    sx={{ mb: 2 }}
                    disabled={loading}
                  />
                ))}

                <Button
                  variant="contained"
                  onClick={handleExecuteCommand}
                  disabled={loading || !selectedCommand}
                  fullWidth
                  startIcon={loading && <CircularProgress size={20} />}
                >
                  {loading ? 'Executing...' : 'Execute Command'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardHeader title="Output" />
              <CardContent>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    minHeight: 300,
                    backgroundColor: 'grey.50',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    overflow: 'auto',
                  }}
                >
                  {output || 'Execute a command to see output...'}
                </Paper>

                {lastResult && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Duration: {lastResult.duration}ms | Timestamp: {lastResult.timestamp}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Agents Tab */}
      <TabPanel value={activeTab} index={1}>
        <Card>
          <CardHeader
            title="Registered Agents"
            action={
              <Button variant="outlined" onClick={loadAgents} disabled={loading}>
                Refresh
              </Button>
            }
          />
          <CardContent>
            {agents.length === 0 ? (
              <Typography color="text.secondary">No agents found</Typography>
            ) : (
              <List>
                {agents.map((agent) => (
                  <ListItem key={agent.id} divider>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">{agent.name}</Typography>
                          <Chip
                            size="small"
                            label={agent.isOnline ? 'Online' : 'Offline'}
                            color={agent.isOnline ? 'success' : 'default'}
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            {agent.role} • {agent.platform}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            ID: {agent.id} | Capabilities: {agent.capabilities.join(', ')}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tasks Tab */}
      <TabPanel value={activeTab} index={2}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardHeader
                title="Tasks"
                action={
                  <Button variant="outlined" onClick={loadTasks} disabled={loading}>
                    Refresh
                  </Button>
                }
              />
              <CardContent>
                {tasks.length === 0 ? (
                  <Typography color="text.secondary">No tasks found</Typography>
                ) : (
                  <List>
                    {tasks.map((task) => (
                      <ListItem key={task.id} divider>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1">{task.title}</Typography>
                              <Chip
                                size="small"
                                label={task.status}
                                color={
                                  task.status === 'completed'
                                    ? 'success'
                                    : task.status === 'working'
                                      ? 'primary'
                                      : 'default'
                                }
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              {task.assignedTo && (
                                <Typography variant="caption" display="block">
                                  Assigned to: {task.assignedTo}
                                </Typography>
                              )}
                              {task.priority && (
                                <Typography variant="caption" display="block">
                                  Priority: {task.priority}
                                </Typography>
                              )}
                              <Typography variant="caption" color="text.secondary">
                                ID: {task.id} | Created: {new Date(task.createdAt).toLocaleString()}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardHeader title="Create Task" />
              <CardContent>
                <CreateTaskForm onSuccess={loadTasks} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Workflows Tab */}
      <TabPanel value={activeTab} index={3}>
        <Card>
          <CardHeader
            title="Workflow Templates"
            action={
              <Button variant="outlined" onClick={loadTemplates} disabled={loading}>
                Refresh
              </Button>
            }
          />
          <CardContent>
            {templates.length === 0 ? (
              <Typography color="text.secondary">No workflow templates found</Typography>
            ) : (
              <Grid container spacing={2}>
                {templates.map((template) => (
                  <Grid size={{ xs: 12, md: 6 }} key={template.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6">{template.name}</Typography>
                        <Typography color="text.secondary" gutterBottom>
                          {template.description}
                        </Typography>
                        <Chip size="small" label={`${template.steps} steps`} />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Monitoring Tab */}
      <TabPanel value={activeTab} index={4}>
        <MonitoringPanel />
      </TabPanel>

      {/* IDE Commands Tab */}
      <TabPanel value={activeTab} index={5}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardHeader title="IDE Commands" subheader="VSCode Extension Commands" />
              <CardContent>
                {IDE_COMMAND_CATEGORIES.map((category) => (
                  <Accordion
                    key={category.id}
                    expanded={expandedCategory === category.id}
                    onChange={() => handleCategoryChange(category.id)}
                    sx={{ mb: 1 }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box>
                        <Typography variant="subtitle2">{category.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {category.description}
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={1}>
                        {category.commands.map((command) => (
                          <Grid key={command}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleExecuteIDECommand(command)}
                              disabled={loading}
                            >
                              {command}
                            </Button>
                          </Grid>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardHeader title="Output" />
              <CardContent>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    minHeight: 400,
                    backgroundColor: 'grey.50',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    overflow: 'auto',
                  }}
                >
                  {ideOutput || 'Click an IDE command to execute...'}
                </Paper>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
}

/**
 * Create Task Form Component
 */
interface CreateTaskFormProps {
  onSuccess: () => void;
}

function CreateTaskForm({ onSuccess }: CreateTaskFormProps): React.ReactElement {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'critical'>('normal');

  const { createTask, loading } = useCLICommands();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createTask({
      title,
      description,
      priority,
    });
    if (result) {
      setTitle('');
      setDescription('');
      setPriority('normal');
      onSuccess();
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <TextField
        fullWidth
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        sx={{ mb: 2 }}
        disabled={loading}
      />
      <TextField
        fullWidth
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        multiline
        rows={3}
        sx={{ mb: 2 }}
        disabled={loading}
      />
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Priority</InputLabel>
        <Select
          value={priority}
          label="Priority"
          onChange={(e) => setPriority(e.target.value as typeof priority)}
          disabled={loading}
        >
          <MenuItem value="low">Low</MenuItem>
          <MenuItem value="normal">Normal</MenuItem>
          <MenuItem value="high">High</MenuItem>
          <MenuItem value="critical">Critical</MenuItem>
        </Select>
      </FormControl>
      <Button type="submit" variant="contained" fullWidth disabled={loading || !title}>
        {loading ? 'Creating...' : 'Create Task'}
      </Button>
    </Box>
  );
}

/**
 * Monitoring Panel Component
 */
function MonitoringPanel(): React.ReactElement {
  const [health, setHealth] = useState<{
    status: string;
    redis: boolean;
    timestamp: string;
  } | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    completionRate: number;
    averageCompletionTime: number;
    byState: Record<string, number>;
  } | null>(null);

  const { checkHealth, getTaskStats, loading } = useCLICommands();

  const loadHealth = async () => {
    const result = await checkHealth();
    if (result) {
      setHealth(result);
    }
  };

  const loadStats = async () => {
    const result = await getTaskStats();
    if (result) {
      setStats(result);
    }
  };

  useEffect(() => {
    loadHealth();
    loadStats();
  }, []);

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader
            title="System Health"
            action={
              <Button variant="outlined" onClick={loadHealth} disabled={loading} size="small">
                Refresh
              </Button>
            }
          />
          <CardContent>
            {health ? (
              <>
                <Typography variant="body1">
                  Status:{' '}
                  <Chip
                    size="small"
                    label={health.status}
                    color={health.status === 'healthy' ? 'success' : 'warning'}
                  />
                </Typography>
                <Typography variant="body1">
                  Redis:{' '}
                  <Chip
                    size="small"
                    label={health.redis ? 'Connected' : 'Disconnected'}
                    color={health.redis ? 'success' : 'error'}
                  />
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Last updated: {new Date(health.timestamp).toLocaleString()}
                </Typography>
              </>
            ) : (
              <Typography color="text.secondary">Loading health status...</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader
            title="Task Statistics"
            action={
              <Button variant="outlined" onClick={loadStats} disabled={loading} size="small">
                Refresh
              </Button>
            }
          />
          <CardContent>
            {stats ? (
              <>
                <Typography variant="body1">Total Tasks: {stats.total}</Typography>
                <Typography variant="body1">
                  Completion Rate: {(stats.completionRate * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body1">
                  Avg Completion Time: {(stats.averageCompletionTime / 1000).toFixed(1)}s
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2">By State:</Typography>
                {Object.entries(stats.byState).map(([state, count]) =>
                  count > 0 ? (
                    <Typography key={state} variant="body2">
                      {state}: {count}
                    </Typography>
                  ) : null
                )}
              </>
            ) : (
              <Typography color="text.secondary">Loading statistics...</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default CLICommandCenter;
