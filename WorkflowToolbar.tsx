import React, { useState } from 'react';
import { 
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  ListItemIcon,
  ListItemText,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  Badge,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Paper
} from '@mui/material';
import {
  Save as SaveIcon,
  PlayArrow as RunIcon,
  Settings as SettingsIcon,
  MoreVert as MoreIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon,
  Share as ShareIcon,
  FileCopy as CloneIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  Publish as PublishIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Timer as TimerIcon,
  CloudDownload as DownloadIcon,
  Help as HelpIcon,
  Feedback as FeedbackIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  BarChart as AnalyticsIcon,
  Build as ConfigIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { Workflow, WorkflowExecutionOptions, WorkflowSchedule, WorkflowExecution } from './types.js';

interface WorkflowToolbarProps {
  workflow: Workflow;
  isRunning: boolean;
  lastExecution?: WorkflowExecution;
  onSave: () => Promise<void>;
  onRun: (options?: WorkflowExecutionOptions) => Promise<void>;
  onSettings: () => void;
  onSchedule: (schedule: WorkflowSchedule) => Promise<void>;
  onViewHistory: () => void;
  onShare: (emails: string[], permissions: string) => Promise<void>;
  onClone: () => Promise<void>;
  onDelete: () => Promise<void>;
  onBack: () => void;
  onRename: (newName: string) => Promise<void>;
  onPublish: () => Promise<void>;
  onViewAnalytics: () => void;
  onDownload: () => void;
  onHelp: () => void;
  onFeedback: (feedback: string) => Promise<void>;
}

const WorkflowToolbar: React.FC<WorkflowToolbarProps> = ({
  workflow,
  isRunning,
  lastExecution,
  onSave,
  onRun,
  onSettings,
  onSchedule,
  onViewHistory,
  onShare,
  onClone,
  onDelete,
  onBack,
  onRename,
  onPublish,
  onViewAnalytics,
  onDownload,
  onHelp,
  onFeedback
}) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [newName, setNewName] = useState(workflow.name);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [permissions, setPermissions] = useState('view');
  const [schedule, setSchedule] = useState<WorkflowSchedule>({
    enabled: false,
    frequency: 'daily',
    time: '00:00',
    days: [],
    startDate: new Date().toISOString().substring(0, 10),
    endDate: ''
  });
  const [runOptions, setRunOptions] = useState<WorkflowExecutionOptions>({
    debugMode: false,
    timeout: 300000, // 5 minutes default
    customInput: {}
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleOpenRenameDialog = () => {
    setNewName(workflow.name);
    setRenameDialogOpen(true);
    handleMenuClose();
  };

  const handleRename = async () => {
    try {
      await onRename(newName);
      setRenameDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Workflow renamed successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to rename workflow: ${error.message}`,
        severity: 'error'
      });
    }
  };
  
  const handleOpenRunDialog = () => {
    setRunDialogOpen(true);
  };
  
  const handleRunWorkflow = async () => {
    setRunDialogOpen(false);
    try {
      await onRun(runOptions);
      setSnackbar({
        open: true,
        message: 'Workflow started successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to run workflow: ${error.message}`,
        severity: 'error'
      });
    }
  };
  
  const handleOpenScheduleDialog = () => {
    setScheduleDialogOpen(true);
    handleMenuClose();
  };
  
  const handleSchedule = async () => {
    try {
      await onSchedule(schedule);
      setScheduleDialogOpen(false);
      setSnackbar({
        open: true,
        message: schedule.enabled 
          ? 'Workflow scheduled successfully' 
          : 'Workflow schedule disabled',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to schedule workflow: ${error.message}`,
        severity: 'error'
      });
    }
  };
  
  const handleOpenShareDialog = () => {
    setShareDialogOpen(true);
    handleMenuClose();
  };
  
  const handleShare = async () => {
    try {
      await onShare(emails, permissions);
      setShareDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Workflow shared successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to share workflow: ${error.message}`,
        severity: 'error'
      });
    }
  };
  
  const handleOpenFeedbackDialog = () => {
    setFeedbackDialogOpen(true);
    handleMenuClose();
  };
  
  const handleSubmitFeedback = async () => {
    try {
      await onFeedback(feedback);
      setFeedbackDialogOpen(false);
      setFeedback('');
      setSnackbar({
        open: true,
        message: 'Thank you for your feedback!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to submit feedback: ${error.message}`,
        severity: 'error'
      });
    }
  };
  
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave();
      setSnackbar({
        open: true,
        message: 'Workflow saved successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to save workflow: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleClone = async () => {
    try {
      await onClone();
      setSnackbar({
        open: true,
        message: 'Workflow cloned successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to clone workflow: ${error.message}`,
        severity: 'error'
      });
    }
    handleMenuClose();
  };
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      try {
        await onDelete();
        setSnackbar({
          open: true,
          message: 'Workflow deleted successfully',
          severity: 'success'
        });
      } catch (error) {
        setSnackbar({
          open: true,
          message: `Failed to delete workflow: ${error.message}`,
          severity: 'error'
        });
      }
    }
    handleMenuClose();
  };
  
  const handlePublish = async () => {
    try {
      await onPublish();
      setSnackbar({
        open: true,
        message: 'Workflow published successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to publish workflow: ${error.message}`,
        severity: 'error'
      });
    }
    handleMenuClose();
  };
  
  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const getLastExecutionStatusColor = () => {
    if (!lastExecution) return undefined;
    
    switch (lastExecution.status) {
      case 'success':
        return 'success';
      case 'failed':
        return 'error';
      case 'running':
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onBack} sx={{ mr: 2 }}>
            <BackIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {workflow.name}
            {workflow.published && (
              <Chip 
                size="small" 
                label="Published"
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
          
          {lastExecution && (
            <Tooltip title={`Last run: ${lastExecution.status}`}>
              <Chip
                icon={
                  lastExecution.status === 'success' ? <SuccessIcon /> : 
                  lastExecution.status === 'failed' ? <ErrorIcon /> :
                  <TimerIcon />
                }
                label={`Last run: ${lastExecution.status}`}
                color={getLastExecutionStatusColor()}
                size="small"
                variant="outlined"
                sx={{ mr: 2 }}
              />
            </Tooltip>
          )}
          
          <Box sx={{ display: 'flex' }}>
            <Tooltip title="Save">
              <IconButton 
                color="inherit" 
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <CircularProgress size={24} /> : <SaveIcon />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title={isRunning ? "Running..." : "Run"}>
              <span>
                <IconButton 
                  color="primary" 
                  onClick={handleOpenRunDialog}
                  disabled={isRunning}
                >
                  {isRunning ? <CircularProgress size={24} /> : <RunIcon />}
                </IconButton>
              </span>
            </Tooltip>
            
            <Tooltip title="Schedule">
              <IconButton color="inherit" onClick={handleOpenScheduleDialog}>
                <Badge 
                  color="secondary" 
                  variant="dot" 
                  invisible={!workflow.schedule?.enabled}
                >
                  <ScheduleIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Analytics">
              <IconButton color="inherit" onClick={onViewAnalytics}>
                <AnalyticsIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Settings">
              <IconButton color="inherit" onClick={onSettings}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            
            <IconButton color="inherit" onClick={handleMenuOpen} edge="end">
              <MoreIcon />
            </IconButton>
            
            <Menu
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleOpenRenameDialog}>
                <ListItemIcon>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Rename</ListItemText>
              </MenuItem>
              
              <MenuItem onClick={onViewHistory}>
                <ListItemIcon>
                  <HistoryIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>View Execution History</ListItemText>
              </MenuItem>
              
              <MenuItem onClick={handleOpenShareDialog}>
                <ListItemIcon>
                  <ShareIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Share</ListItemText>
              </MenuItem>
              
              <MenuItem onClick={handleClone}>
                <ListItemIcon>
                  <CloneIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Clone</ListItemText>
              </MenuItem>
              
              <MenuItem onClick={onDownload}>
                <ListItemIcon>
                  <DownloadIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Export</ListItemText>
              </MenuItem>
              
              <MenuItem onClick={handlePublish}>
                <ListItemIcon>
                  <PublishIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{workflow.published ? 'Unpublish' : 'Publish'}</ListItemText>
              </MenuItem>
              
              <Divider />
              
              <MenuItem onClick={handleOpenFeedbackDialog}>
                <ListItemIcon>
                  <FeedbackIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Send Feedback</ListItemText>
              </MenuItem>
              
              <MenuItem onClick={onHelp}>
                <ListItemIcon>
                  <HelpIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Help</ListItemText>
              </MenuItem>
              
              <Divider />
              
              <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                <ListItemIcon>
                  <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText>Delete</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)}>
        <DialogTitle>Rename Workflow</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Workflow Name"
            fullWidth
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleRename} 
            color="primary"
            disabled={!newName.trim() || newName === workflow.name}
          >
            Rename
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Run Dialog */}
      <Dialog 
        open={runDialogOpen} 
        onClose={() => setRunDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Run Workflow</DialogTitle>
        <DialogContent>
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>Execution Options</Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={runOptions.debugMode}
                      onChange={(e) => setRunOptions({...runOptions, debugMode: e.target.checked})}
                    />
                  }
                  label="Debug Mode"
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={8}>
                <TextField
                  label="Timeout (ms)"
                  type="number"
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={runOptions.timeout}
                  onChange={(e) => setRunOptions({...runOptions, timeout: parseInt(e.target.value)})}
                  InputProps={{ inputProps: { min: 1000, max: 3600000 } }}
                />
              </Grid>
            </Grid>
          </Paper>
          
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>Custom Input (JSON)</Typography>
            
            <TextField
              margin="dense"
              label="Custom Input"
              fullWidth
              multiline
              rows={8}
              variant="outlined"
              value={JSON.stringify(runOptions.customInput, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setRunOptions({...runOptions, customInput: parsed});
                } catch {
                  // Allow invalid JSON during typing
                }
              }}
            />
            
            <Typography variant="caption" color="text.secondary">
              Enter JSON that will be passed as input to your workflow
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRunDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleRunWorkflow} 
            color="primary" 
            variant="contained"
            startIcon={<RunIcon />}
          >
            Run Now
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Schedule Dialog */}
      <Dialog 
        open={scheduleDialogOpen} 
        onClose={() => setScheduleDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Schedule Workflow</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={schedule.enabled}
                  onChange={(e) => setSchedule({...schedule, enabled: e.target.checked})}
                />
              }
              label="Enable Schedule"
            />
          </Box>
          
          {schedule.enabled && (
            <>
              <FormControl fullWidth margin="dense">
                <InputLabel>Frequency</InputLabel>
                <Select
                  value={schedule.frequency}
                  label="Frequency"
                  onChange={(e) => setSchedule({...schedule, frequency: e.target.value})}
                >
                  <MenuItem value="hourly">Hourly</MenuItem>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="custom">Custom (CRON)</MenuItem>
                </Select>
              </FormControl>
              
              {schedule.frequency === 'custom' ? (
                <TextField
                  margin="dense"
                  label="CRON Expression"
                  fullWidth
                  variant="outlined"
                  value={schedule.cronExpression || ''}
                  onChange={(e) => setSchedule({...schedule, cronExpression: e.target.value})}
                  helperText="e.g. '0 0 * * *' for daily at midnight"
                />
              ) : (
                <>
                  {schedule.frequency !== 'hourly' && (
                    <TextField
                      margin="dense"
                      label="Time"
                      type="time"
                      fullWidth
                      variant="outlined"
                      value={schedule.time}
                      onChange={(e) => setSchedule({...schedule, time: e.target.value})}
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                  
                  {schedule.frequency === 'weekly' && (
                    <FormControl fullWidth margin="dense">
                      <InputLabel>Days of Week</InputLabel>
                      <Select
                        multiple
                        value={schedule.days}
                        label="Days of Week"
                        onChange={(e) => setSchedule({...schedule, days: e.target.value as string[]})}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                          <MenuItem key={day} value={day}>
                            {day}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  
                  {schedule.frequency === 'monthly' && (
                    <TextField
                      margin="dense"
                      label="Day of Month"
                      type="number"
                      fullWidth
                      variant="outlined"
                      value={schedule.dayOfMonth || 1}
                      onChange={(e) => setSchedule({...schedule, dayOfMonth: parseInt(e.target.value)})}
                      InputProps={{ inputProps: { min: 1, max: 31 } }}
                    />
                  )}
                </>
              )}
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="dense"
                    label="Start Date"
                    type="date"
                    fullWidth
                    variant="outlined"
                    value={schedule.startDate}
                    onChange={(e) => setSchedule({...schedule, startDate: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="dense"
                    label="End Date (Optional)"
                    type="date"
                    fullWidth
                    variant="outlined"
                    value={schedule.endDate || ''}
                    onChange={(e) => setSchedule({...schedule, endDate: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSchedule} 
            color="primary"
            variant="contained"
          >
            {schedule.enabled ? 'Save Schedule' : 'Disable Schedule'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)}>
        <DialogTitle>Share Workflow</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Enter email addresses of users you want to share with
          </Typography>
          
          <TextField
            label="Email Addresses"
            fullWidth
            variant="outlined"
            placeholder="Enter emails separated by commas"
            value={emails.join(',')}
            onChange={(e) => setEmails(e.target.value.split(',').map(email => email.trim()))}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth variant="outlined">
            <InputLabel>Permission</InputLabel>
            <Select
              value={permissions}
              label="Permission"
              onChange={(e) => setPermissions(e.target.value)}
            >
              <MenuItem value="view">View only</MenuItem>
              <MenuItem value="edit">Edit</MenuItem>
              <MenuItem value="admin">Admin (can share with others)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleShare} 
            color="primary"
            disabled={emails.length === 0}
          >
            Share
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onClose={() => setFeedbackDialogOpen(false)}>
        <DialogTitle>Send Feedback</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Your Feedback"
            fullWidth
            multiline
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitFeedback} 
            color="primary"
            disabled={!feedback.trim()}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default WorkflowToolbar;
