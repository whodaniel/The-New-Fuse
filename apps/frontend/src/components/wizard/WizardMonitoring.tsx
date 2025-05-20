
export {}
exports.WizardMonitoring = WizardMonitoring;
import react_1 from 'react';
import material_1 from '@mui/material';
import icons_material_1 from '@mui/icons-material';
import WizardWebSocket_1 from './WizardWebSocket.js';
import WizardProvider_1 from './WizardProvider.js';
function WizardMonitoring(): any {
    const { subscribeToEvent, unsubscribeFromEvent, sendMessage } = (0, WizardWebSocket_1.useWizardWebSocket)();
    const { state } = (0, WizardProvider_1.useWizard)();
    const [metrics, setMetrics] = (0, react_1.useState)(null);
    const [alerts, setAlerts] = (0, react_1.useState)([]);
    const [logs, setLogs] = (0, react_1.useState)([]);
    const [showSettings, setShowSettings] = (0, react_1.useState)(false);
    const [settings, setSettings] = (0, react_1.useState)({
        alertThreshold: 80,
        logRetentionDays: 7,
        metricsInterval: 5000
    });
    (0, react_1.useEffect)(() => {
        const handleMetricsUpdate = (data): any => {
            setMetrics(data);
            checkThresholds(data);
        };
        const handleAlert = (alert): any => {
            setAlerts((prev: any) => [alert, ...prev]);
        };
        const handlePerformanceLog = (log): any => {
            setLogs((prev: any) => [log, ...prev].slice(0, 1000));
        };
        subscribeToEvent('system_metrics', handleMetricsUpdate);
        subscribeToEvent('system_alert', handleAlert);
        subscribeToEvent('performance_log', handlePerformanceLog);
        sendMessage('start_monitoring', { interval: settings.metricsInterval });
        return () => {
            unsubscribeFromEvent('system_metrics');
            unsubscribeFromEvent('system_alert');
            unsubscribeFromEvent('performance_log');
        };
    }, [subscribeToEvent, unsubscribeFromEvent, sendMessage, settings.metricsInterval]);
    const checkThresholds = (metrics): any => {
        if (metrics.cpu > settings.alertThreshold) {
            createAlert('warning', `High CPU usage: ${metrics.cpu}%`);
        }
        if (metrics.memory > settings.alertThreshold) {
            createAlert('warning', `High memory usage: ${metrics.memory}%`);
        }
        if (metrics.errorRate > 5) {
            createAlert('error', `High error rate: ${metrics.errorRate}%`);
        }
    };
    const createAlert = (type, message): any => {
        const alert = {
            id: `alert-${Date.now()}`,
            type,
            message,
            timestamp: Date.now(),
            resolved: false
        };
        setAlerts((prev: any) => [alert, ...prev]);
    };
    const resolveAlert = (alertId): any => {
        setAlerts((prev: any) => prev.map(alert => alert.id === alertId ? Object.assign(Object.assign({}, alert), { resolved: true }) : alert));
    };
    const formatDuration = (ms): any => {
        if (ms < 1000)
            return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };
    const renderMetrics = (): any => (<material_1.Grid container spacing={2}>
            <material_1.Grid item xs={12} md={3}>
                <material_1.Card>
                    <material_1.CardContent>
                        <material_1.Box display="flex" alignItems="center" gap={1}>
                            <icons_material_1.Memory />
                            <material_1.Typography variant="h6">CPU Usage</material_1.Typography>
                        </material_1.Box>
                        <material_1.LinearProgress variant="determinate" value={(metrics === null || metrics === void 0 ? void 0 : metrics.cpu) || 0} color={(metrics === null || metrics === void 0 ? void 0 : metrics.cpu) && metrics.cpu > 80 ? 'error' : 'primary'}/>
                        <material_1.Typography variant="h4" align="center" mt={1}>
                            {metrics === null || metrics === void 0 ? void 0 : metrics.cpu.toFixed(1)}%
                        </material_1.Typography>
                    </material_1.CardContent>
                </material_1.Card>
            </material_1.Grid>

            <material_1.Grid item xs={12} md={3}>
                <material_1.Card>
                    <material_1.CardContent>
                        <material_1.Box display="flex" alignItems="center" gap={1}>
                            <icons_material_1.Speed />
                            <material_1.Typography variant="h6">Memory</material_1.Typography>
                        </material_1.Box>
                        <material_1.LinearProgress variant="determinate" value={(metrics === null || metrics === void 0 ? void 0 : metrics.memory) || 0} color={(metrics === null || metrics === void 0 ? void 0 : metrics.memory) && metrics.memory > 80 ? 'error' : 'primary'}/>
                        <material_1.Typography variant="h4" align="center" mt={1}>
                            {metrics === null || metrics === void 0 ? void 0 : metrics.memory.toFixed(1)}%
                        </material_1.Typography>
                    </material_1.CardContent>
                </material_1.Card>
            </material_1.Grid>

            <material_1.Grid item xs={12} md={3}>
                <material_1.Card>
                    <material_1.CardContent>
                        <material_1.Box display="flex" alignItems="center" gap={1}>
                            <icons_material_1.Timeline />
                            <material_1.Typography variant="h6">Active Tasks</material_1.Typography>
                        </material_1.Box>
                        <material_1.Box display="flex" justifyContent="center" alignItems="center" gap={2} mt={2}>
                            <material_1.Chip label={`Active: ${(metrics === null || metrics === void 0 ? void 0 : metrics.activeAgents) || 0}`} color="primary"/>
                            <material_1.Chip label={`Queued: ${(metrics === null || metrics === void 0 ? void 0 : metrics.queuedTasks) || 0}`} color="secondary"/>
                        </material_1.Box>
                    </material_1.CardContent>
                </material_1.Card>
            </material_1.Grid>

            <material_1.Grid item xs={12} md={3}>
                <material_1.Card>
                    <material_1.CardContent>
                        <material_1.Box display="flex" alignItems="center" gap={1}>
                            <icons_material_1.Warning />
                            <material_1.Typography variant="h6">Error Rate</material_1.Typography>
                        </material_1.Box>
                        <material_1.Typography variant="h4" align="center" mt={1} color={(metrics === null || metrics === void 0 ? void 0 : metrics.errorRate) && metrics.errorRate > 5 ? 'error' : 'inherit'}>
                            {metrics === null || metrics === void 0 ? void 0 : metrics.errorRate.toFixed(2)}%
                        </material_1.Typography>
                    </material_1.CardContent>
                </material_1.Card>
            </material_1.Grid>
        </material_1.Grid>);
    const renderAlerts = (): any => (<material_1.Card>
            <material_1.CardContent>
                <material_1.Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <material_1.Typography variant="h6">System Alerts</material_1.Typography>
                    <material_1.Badge badgeContent={alerts.filter(a => !a.resolved).length} color="error">
                        <icons_material_1.Warning />
                    </material_1.Badge>
                </material_1.Box>
                <material_1.List>
                    {alerts.slice(0, 5).map(alert => (<material_1.ListItem key={alert.id} secondaryAction={!alert.resolved && (<material_1.Button size="small" onClick={() => resolveAlert(alert.id)}>
                                        Resolve
                                    </material_1.Button>)}>
                            <material_1.ListItemIcon>
                                {alert.type === 'error' ? (<icons_material_1.Warning color="error"/>) : (<icons_material_1.Warning color="warning"/>)}
                            </material_1.ListItemIcon>
                            <material_1.ListItemText primary={alert.message} secondary={new Date(alert.timestamp).toLocaleString()} sx={{ textDecoration: alert.resolved ? 'line-through' : 'none' }}/>
                        </material_1.ListItem>))}
                </material_1.List>
            </material_1.CardContent>
        </material_1.Card>);
    const renderPerformanceLogs = (): any => (<material_1.Card>
            <material_1.CardContent>
                <material_1.Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <material_1.Typography variant="h6">Performance Logs</material_1.Typography>
                    <material_1.IconButton onClick={() => sendMessage('refresh_logs', {})}>
                        <icons_material_1.Refresh />
                    </material_1.IconButton>
                </material_1.Box>
                <material_1.List>
                    {logs.slice(0, 10).map((log, index) => (<material_1.ListItem key={index}>
                            <material_1.ListItemText primary={log.operation} secondary={<>
                                        {new Date(log.timestamp).toLocaleString()} - 
                                        Duration: {formatDuration(log.duration)} - 
                                        Status: {log.status}
                                    </>}/>
                        </material_1.ListItem>))}
                </material_1.List>
            </material_1.CardContent>
        </material_1.Card>);
    return (<material_1.Box>
            <material_1.Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <material_1.Typography variant="h5">System Monitoring</material_1.Typography>
                <material_1.Tooltip title="Monitoring Settings">
                    <material_1.IconButton onClick={() => setShowSettings(true)}>
                        <icons_material_1.Settings />
                    </material_1.IconButton>
                </material_1.Tooltip>
            </material_1.Box>

            <material_1.Grid container spacing={2}>
                <material_1.Grid item xs={12}>
                    {renderMetrics()}
                </material_1.Grid>
                <material_1.Grid item xs={12} md={6}>
                    {renderAlerts()}
                </material_1.Grid>
                <material_1.Grid item xs={12} md={6}>
                    {renderPerformanceLogs()}
                </material_1.Grid>
            </material_1.Grid>

            <material_1.Dialog open={showSettings} onClose={() => setShowSettings(false)}>
                <material_1.DialogTitle>Monitoring Settings</material_1.DialogTitle>
                <material_1.DialogContent>
                    <material_1.Grid container spacing={2}>
                        <material_1.Grid item xs={12}>
                            <material_1.TextField fullWidth label="Alert Threshold (%)" type="number" value={settings.alertThreshold} onChange={(e) => setSettings((prev: any) => (Object.assign(Object.assign({}, prev), { alertThreshold: Number(e.target.value) })))}/>
                        </material_1.Grid>
                        <material_1.Grid item xs={12}>
                            <material_1.TextField fullWidth label="Log Retention (days)" type="number" value={settings.logRetentionDays} onChange={(e) => setSettings((prev: any) => (Object.assign(Object.assign({}, prev), { logRetentionDays: Number(e.target.value) })))}/>
                        </material_1.Grid>
                        <material_1.Grid item xs={12}>
                            <material_1.TextField fullWidth label="Metrics Interval (ms)" type="number" value={settings.metricsInterval} onChange={(e) => setSettings((prev: any) => (Object.assign(Object.assign({}, prev), { metricsInterval: Number(e.target.value) })))}/>
                        </material_1.Grid>
                    </material_1.Grid>
                </material_1.DialogContent>
            </material_1.Dialog>
        </material_1.Box>);
}
export {};
//# sourceMappingURL=WizardMonitoring.js.map