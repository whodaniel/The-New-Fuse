// A2A Debugger Component - Real-time debugging interface for multi-agent communication
// Provides comprehensive debugging tools with message tracing, conversation analysis, and real-time monitoring

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  LinearProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Pause as PauseIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  BugReport as BugReportIcon,
  Speed as SpeedIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Timeline as TimelineIcon,
  NetworkCheck as NetworkIcon,
  Message as MessageIcon,
  Agent as AgentIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
} from 'recharts';

// Interfaces matching backend
interface A2ADebugMessage {
  id: string;
  messageId: string;
  sessionId: string;
  timestamp: number;
  fromAgent: string;
  toAgent: string;
  messageType: string;
  priority: number;
  payload: any;
  metadata: {
    routingPath: string[];
    processingTime: number;
    retryCount: number;
    errors: string[];
    debugLevel: number;
  };
  status: 'sent' | 'received' | 'processed' | 'failed' | 'timeout';
  performanceMetrics: {
    sendTime: number;
    receiveTime?: number;
    processTime?: number;
    totalLatency?: number;
    bandwidth?: number;
  };
}

interface DebugSession {
  id: string;
  name: string;
  description: string;
  startTime: number;
  endTime?: number;
  status: 'active' | 'paused' | 'stopped';
  capturedMessages: A2ADebugMessage[];
  settings: {
    capturePayloads: boolean;
    captureStackTraces: boolean;
    maxMessages: number;
    realTimeUpdates: boolean;
    verboseLogging: boolean;
  };
}

interface ConversationTrace {
  id: string;
  participants: string[];
  startTime: number;
  endTime?: number;
  messages: A2ADebugMessage[];
  status: 'active' | 'completed' | 'failed';
  summary: {
    totalMessages: number;
    avgLatency: number;
    errorCount: number;
    duration: number;
  };
}

interface AgentDebugInfo {
  id: string;
  name: string;
  type: string;
  status: string;
  messageStats: {
    sent: number;
    received: number;
    processed: number;
    failed: number;
  };
  performanceMetrics: {
    avgResponseTime: number;
    reliability: number;
    throughput: number;
    errorRate: number;
  };
  lastActivity: number;
}

interface DebugFilter {
  type: 'agent' | 'messageType' | 'priority' | 'keyword';
  value: string;
  operator: 'equals' | 'contains' | 'greater' | 'less';
  enabled: boolean;
}

const A2ADebugger: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [debugSessions, setDebugSessions] = useState<DebugSession[]>([]);
  const [activeSession, setActiveSession] = useState<DebugSession | null>(null);
  const [capturedMessages, setCapturedMessages] = useState<A2ADebugMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationTrace[]>([]);
  const [agents, setAgents] = useState<AgentDebugInfo[]>([]);
  const [filters, setFilters] = useState<DebugFilter[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<A2ADebugMessage | null>(null);
  const [createSessionDialog, setCreateSessionDialog] = useState(false);
  const [filtersDialog, setFiltersDialog] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);

  // Form states
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionDescription, setNewSessionDescription] = useState('');

  // Real-time connection
  const eventSourceRef = useRef<EventSource | null>(null);

  // Load initial data
  useEffect(() => {
    loadDebugSessions();
    loadAgents();
  }, []);

  // Real-time updates
  useEffect(() => {
    if (activeSession && realTimeUpdates) {
      connectToRealTimeUpdates(activeSession.id);
    }
    
    return () => {
      disconnectRealTimeUpdates();
    };
  }, [activeSession, realTimeUpdates]);

  const connectToRealTimeUpdates = (sessionId: string) => {
    disconnectRealTimeUpdates();
    
    eventSourceRef.current = new EventSource(`/api/debugging/sessions/${sessionId}/stream`);
    
    eventSourceRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'messageCapture':
          handleNewMessage(data.message);
          break;
        case 'conversationUpdate':
          handleConversationUpdate(data.conversation);
          break;
        case 'agentUpdate':
          handleAgentUpdate(data.agent);
          break;
      }
    };
    
    eventSourceRef.current.onerror = () => {
      console.error('Real-time connection error');
      setTimeout(() => connectToRealTimeUpdates(sessionId), 5000); // Retry after 5 seconds
    };
  };

  const disconnectRealTimeUpdates = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  const handleNewMessage = (message: A2ADebugMessage) => {
    setCapturedMessages(prev => [...prev, message].slice(-1000)); // Keep last 1000 messages
  };

  const handleConversationUpdate = (conversation: ConversationTrace) => {
    setConversations(prev => {
      const index = prev.findIndex(c => c.id === conversation.id);
      if (index >= 0) {
        const newConversations = [...prev];
        newConversations[index] = conversation;
        return newConversations;
      }
      return [...prev, conversation];
    });
  };

  const handleAgentUpdate = (agent: AgentDebugInfo) => {
    setAgents(prev => {
      const index = prev.findIndex(a => a.id === agent.id);
      if (index >= 0) {
        const newAgents = [...prev];
        newAgents[index] = agent;
        return newAgents;
      }
      return [...prev, agent];
    });
  };

  // API calls
  const loadDebugSessions = async () => {
    try {
      const response = await fetch('/api/debugging/sessions');
      const sessions = await response.json();
      setDebugSessions(sessions);
    } catch (error) {
      console.error('Error loading debug sessions:', error);
    }
  };

  const loadAgents = async () => {
    try {
      const response = await fetch('/api/debugging/agents');
      const agentList = await response.json();
      setAgents(agentList);
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  const createDebugSession = async () => {
    try {
      const response = await fetch('/api/debugging/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSessionName,
          description: newSessionDescription,
          settings: {
            capturePayloads: true,
            realTimeUpdates: true,
            maxMessages: 5000,
          },
        }),
      });
      
      const result = await response.json();
      if (result.sessionId) {
        await loadDebugSessions();
        setCreateSessionDialog(false);
        setNewSessionName('');
        setNewSessionDescription('');
      }
    } catch (error) {
      console.error('Error creating debug session:', error);
    }
  };

  const startCapturing = async (sessionId: string) => {
    try {
      await fetch(`/api/debugging/sessions/${sessionId}/active`, { method: 'PUT' });
      setIsCapturing(true);
      
      // Load session details
      const session = debugSessions.find(s => s.id === sessionId);
      if (session) {
        setActiveSession(session);
        loadSessionMessages(sessionId);
      }
    } catch (error) {
      console.error('Error starting capture:', error);
    }
  };

  const stopCapturing = async () => {
    if (!activeSession) return;
    
    try {
      await fetch(`/api/debugging/sessions/${activeSession.id}/stop`, { method: 'PUT' });
      setIsCapturing(false);
      setActiveSession(null);
      disconnectRealTimeUpdates();
    } catch (error) {
      console.error('Error stopping capture:', error);
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/debugging/sessions/${sessionId}/messages`);
      const data = await response.json();
      setCapturedMessages(data.messages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const exportSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/debugging/sessions/${sessionId}/export`);
      const data = await response.json();
      
      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `debug-session-${sessionId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting session:', error);
    }
  };

  const analyzeMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/debugging/messages/${messageId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeRecommendations: true }),
      });
      
      const analysis = await response.json();
      console.log('Message analysis:', analysis);
      // Could show analysis in a dialog or update UI
    } catch (error) {
      console.error('Error analyzing message:', error);
    }
  };

  // Utility functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed': return <CheckCircleIcon color="success" />;
      case 'failed': return <ErrorIcon color="error" />;
      case 'timeout': return <WarningIcon color="warning" />;
      case 'sent': return <MessageIcon color="info" />;
      default: return <InfoIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'success';
      case 'failed': return 'error';
      case 'timeout': return 'warning';
      case 'sent': return 'info';
      default: return 'default';
    }
  };

  const formatLatency = (latency?: number) => {
    if (!latency) return 'N/A';
    return latency < 1000 ? `${latency}ms` : `${(latency / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Chart data preparation
  const prepareLatencyChart = () => {
    return capturedMessages
      .filter(msg => msg.performanceMetrics.totalLatency)
      .slice(-50) // Last 50 messages
      .map((msg, index) => ({
        index,
        latency: msg.performanceMetrics.totalLatency,
        timestamp: formatTimestamp(msg.timestamp),
      }));
  };

  const prepareMessageTypeChart = () => {
    const typeCounts = capturedMessages.reduce((acc, msg) => {
      acc[msg.messageType] = (acc[msg.messageType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCounts).map(([type, count]) => ({
      messageType: type,
      count,
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          A2A Communication Debugger
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={realTimeUpdates}
                onChange={(e) => setRealTimeUpdates(e.target.checked)}
              />
            }
            label="Real-time Updates"
          />
          <Button
            variant="contained"
            startIcon={<BugReportIcon />}
            onClick={() => setCreateSessionDialog(true)}
          >
            New Debug Session
          </Button>
        </Box>
      </Box>

      {/* Status Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="textSecondary">
                  Active Session
                </Typography>
                <Typography variant="h5">
                  {activeSession ? activeSession.name : 'None'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="textSecondary">
                  Capturing
                </Typography>
                <Chip
                  label={isCapturing ? 'Active' : 'Stopped'}
                  color={isCapturing ? 'success' : 'default'}
                  icon={isCapturing ? <PlayIcon /> : <StopIcon />}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="textSecondary">
                  Messages Captured
                </Typography>
                <Typography variant="h5">
                  {capturedMessages.length}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="textSecondary">
                  Active Agents
                </Typography>
                <Typography variant="h5">
                  {agents.filter(a => a.status === 'online').length}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Control Panel */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Debug Session</InputLabel>
                <Select
                  value={activeSession?.id || ''}
                  onChange={(e) => {
                    const session = debugSessions.find(s => s.id === e.target.value);
                    setActiveSession(session || null);
                  }}
                >
                  {debugSessions.map((session) => (
                    <MenuItem key={session.id} value={session.id}>
                      {session.name} ({session.status})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={8}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<PlayIcon />}
                  onClick={() => activeSession && startCapturing(activeSession.id)}
                  disabled={isCapturing || !activeSession}
                  color="success"
                >
                  Start Capture
                </Button>
                <Button
                  variant="contained"
                  startIcon={<StopIcon />}
                  onClick={stopCapturing}
                  disabled={!isCapturing}
                  color="error"
                >
                  Stop Capture
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={() => setFiltersDialog(true)}
                >
                  Filters
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => activeSession && exportSession(activeSession.id)}
                  disabled={!activeSession}
                >
                  Export
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadDebugSessions}
                >
                  Refresh
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Card>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Message Trace" icon={<MessageIcon />} />
          <Tab label="Conversations" icon={<TimelineIcon />} />
          <Tab label="Agents" icon={<AgentIcon />} />
          <Tab label="Analytics" icon={<SpeedIcon />} />
        </Tabs>

        <CardContent>
          {/* Message Trace Tab */}
          {activeTab === 0 && (
            <Box>
              <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>From Agent</TableCell>
                      <TableCell>To Agent</TableCell>
                      <TableCell>Message Type</TableCell>
                      <TableCell>Latency</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {capturedMessages.map((message) => (
                      <TableRow key={message.id} hover>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(message.status)}
                            label={message.status}
                            color={getStatusColor(message.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatTimestamp(message.timestamp)}</TableCell>
                        <TableCell>{message.fromAgent}</TableCell>
                        <TableCell>{message.toAgent}</TableCell>
                        <TableCell>{message.messageType}</TableCell>
                        <TableCell>{formatLatency(message.performanceMetrics.totalLatency)}</TableCell>
                        <TableCell>
                          <Chip
                            label={message.priority}
                            color={message.priority <= 2 ? 'error' : message.priority <= 3 ? 'warning' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Analyze Message">
                            <IconButton
                              size="small"
                              onClick={() => analyzeMessage(message.messageId)}
                            >
                              <BugReportIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => setSelectedMessage(message)}
                            >
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Conversations Tab */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Active Conversations
              </Typography>
              {conversations.map((conversation) => (
                <Accordion key={conversation.id}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Chip
                        label={conversation.status}
                        color={conversation.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                      <Typography variant="body1">
                        {conversation.participants.join(' ↔ ')}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ ml: 'auto' }}>
                        {conversation.summary.totalMessages} messages
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2">Summary</Typography>
                        <List dense>
                          <ListItem>
                            <ListItemText
                              primary="Total Messages"
                              secondary={conversation.summary.totalMessages}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="Average Latency"
                              secondary={formatLatency(conversation.summary.avgLatency)}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="Error Count"
                              secondary={conversation.summary.errorCount}
                            />
                          </ListItem>
                        </List>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2">Timeline</Typography>
                        <Box sx={{ height: 200 }}>
                          {/* Would implement conversation flow visualization */}
                          <Typography variant="body2" color="textSecondary">
                            Conversation flow visualization would go here
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}

          {/* Agents Tab */}
          {activeTab === 2 && (
            <Box>
              <Grid container spacing={3}>
                {agents.map((agent) => (
                  <Grid item xs={12} sm={6} md={4} key={agent.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Badge
                            color={agent.status === 'online' ? 'success' : 'error'}
                            variant="dot"
                          >
                            <AgentIcon />
                          </Badge>
                          <Typography variant="h6" sx={{ ml: 1 }}>
                            {agent.name}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                          Type: {agent.type}
                        </Typography>
                        
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Message Statistics
                        </Typography>
                        <Grid container spacing={1} sx={{ mb: 2 }}>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              Sent: {agent.messageStats.sent}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              Received: {agent.messageStats.received}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              Processed: {agent.messageStats.processed}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              Failed: {agent.messageStats.failed}
                            </Typography>
                          </Grid>
                        </Grid>

                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Performance
                        </Typography>
                        <Typography variant="body2">
                          Response Time: {formatLatency(agent.performanceMetrics.avgResponseTime)}
                        </Typography>
                        <Typography variant="body2">
                          Reliability: {(agent.performanceMetrics.reliability * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="body2">
                          Error Rate: {agent.performanceMetrics.errorRate.toFixed(1)}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Analytics Tab */}
          {activeTab === 3 && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Message Latency Trends
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={prepareLatencyChart()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="index" />
                          <YAxis />
                          <RechartsTooltip />
                          <Line
                            type="monotone"
                            dataKey="latency"
                            stroke="#8884d8"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Message Types Distribution
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={prepareMessageTypeChart()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="messageType" />
                          <YAxis />
                          <RechartsTooltip />
                          <Bar dataKey="count" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Error Analysis
                      </Typography>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Error Type</TableCell>
                              <TableCell>Count</TableCell>
                              <TableCell>Last Occurrence</TableCell>
                              <TableCell>Affected Agents</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {/* Would show error analysis data */}
                            <TableRow>
                              <TableCell colSpan={4} align="center">
                                <Typography variant="body2" color="textSecondary">
                                  No errors detected in current session
                                </Typography>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Create Session Dialog */}
      <Dialog open={createSessionDialog} onClose={() => setCreateSessionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Debug Session</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Session Name"
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={newSessionDescription}
            onChange={(e) => setNewSessionDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateSessionDialog(false)}>Cancel</Button>
          <Button onClick={createDebugSession} variant="contained" disabled={!newSessionName}>
            Create Session
          </Button>
        </DialogActions>
      </Dialog>

      {/* Message Details Dialog */}
      {selectedMessage && (
        <Dialog
          open={Boolean(selectedMessage)}
          onClose={() => setSelectedMessage(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Message Details
            <IconButton
              onClick={() => setSelectedMessage(null)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Message ID: {selectedMessage.messageId}
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Basic Information</Typography>
                <Typography variant="body2">From: {selectedMessage.fromAgent}</Typography>
                <Typography variant="body2">To: {selectedMessage.toAgent}</Typography>
                <Typography variant="body2">Type: {selectedMessage.messageType}</Typography>
                <Typography variant="body2">Priority: {selectedMessage.priority}</Typography>
                <Typography variant="body2">Status: {selectedMessage.status}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Performance Metrics</Typography>
                <Typography variant="body2">
                  Send Time: {formatTimestamp(selectedMessage.performanceMetrics.sendTime)}
                </Typography>
                <Typography variant="body2">
                  Total Latency: {formatLatency(selectedMessage.performanceMetrics.totalLatency)}
                </Typography>
                <Typography variant="body2">
                  Processing Time: {formatLatency(selectedMessage.performanceMetrics.processTime)}
                </Typography>
                <Typography variant="body2">
                  Bandwidth: {selectedMessage.performanceMetrics.bandwidth} bytes
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2">Payload</Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 200, overflow: 'auto' }}>
                  <pre style={{ margin: 0, fontSize: '0.8rem' }}>
                    {JSON.stringify(selectedMessage.payload, null, 2)}
                  </pre>
                </Paper>
              </Grid>
              
              {selectedMessage.metadata.errors.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Errors</Typography>
                  {selectedMessage.metadata.errors.map((error, index) => (
                    <Alert key={index} severity="error" sx={{ mt: 1 }}>
                      {error}
                    </Alert>
                  ))}
                </Grid>
              )}
            </Grid>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
};

export default A2ADebugger;