
export {}
import react_1 from 'react';
import material_1 from '@mui/material';
import recharts_1 from 'recharts';
const MetricCard = ({ title, value, unit, history }): any => {
    const theme = (0, material_1.useTheme)();
    return (<material_1.Card sx={{ height: '100%' }}>
      <material_1.CardContent>
        <material_1.Typography variant="h6" component="div" gutterBottom>
          {title}
        </material_1.Typography>
        <material_1.Typography variant="h4" component="div" color="primary">
          {value.toFixed(2)} {unit}
        </material_1.Typography>
        <material_1.Box sx={{ height: 100, mt: 2 }}>
          <recharts_1.ResponsiveContainer width="100%" height="100%">
            <recharts_1.LineChart data={history}>
              <recharts_1.CartesianGrid strokeDasharray="3 3"/>
              <recharts_1.XAxis dataKey="timestamp" tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}/>
              <recharts_1.YAxis />
              <recharts_1.Tooltip labelFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}/>
              <recharts_1.Line type="monotone" dataKey="value" stroke={theme.palette.primary.main} dot={false}/>
            </recharts_1.LineChart>
          </recharts_1.ResponsiveContainer>
        </material_1.Box>
      </material_1.CardContent>
    </material_1.Card>);
};
const PerformanceDashboard = (): any => {
    const [metrics, setMetrics] = (0, react_1.useState)(null);
    const [connected, setConnected] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const ws = (0, react_1.useRef)(null);
    const [history, setHistory] = (0, react_1.useState)({
        queue: [],
        latency: [],
        memory: [],
        cpu: [],
    });
    (0, react_1.useEffect)(() => {
        const connect = (): any => {
            const socket = new WebSocket('ws://localhost:8000/ws/metrics');
            socket.onopen = () => {
                setConnected(true);
                setError(null);
            };
            socket.onclose = () => {
                setConnected(false);
                setTimeout(connect, 5000);
            };
            socket.onerror = (event) => {
                setError('WebSocket connection error');
                console.error('WebSocket error:', event);
            };
            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setMetrics(data);
                    const timestamp = Date.now();
                    setHistory((prev: any) => ({
                        queue: [...prev.queue.slice(-50), { timestamp, value: data.avg_queue_length }],
                        latency: [...prev.latency.slice(-50), { timestamp, value: data.avg_message_latency_ms }],
                        memory: [...prev.memory.slice(-50), { timestamp, value: data.avg_memory_usage_mb }],
                        cpu: [...prev.cpu.slice(-50), { timestamp, value: data.avg_cpu_usage_percent }],
                    }));
                }
                catch (e) {
                    console.error('Error parsing metrics:', e);
                }
            };
            ws.current = socket;
        };
        connect();
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);
    if (!connected) {
        return (<material_1.Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <material_1.CircularProgress />
        <material_1.Typography variant="body1" sx={{ ml: 2 }}>
          Connecting to metrics service...
        </material_1.Typography>
      </material_1.Box>);
    }
    if (error) {
        return (<material_1.Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </material_1.Alert>);
    }
    if (!metrics) {
        return (<material_1.Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <material_1.CircularProgress />
      </material_1.Box>);
    }
    return (<material_1.Box sx={{ flexGrow: 1, p: 3 }}>
      
      {Object.entries(metrics.alerts).map(([key, alert]) => (<material_1.Alert key={key} severity={alert.level} sx={{ mb: 2 }}>
          {alert.message} (Current value: {alert.value})
        </material_1.Alert>))}

      <material_1.Grid container spacing={3}>
        <material_1.Grid item xs={12} md={6}>
          <MetricCard title="Message Queue Length" value={metrics.avg_queue_length} unit="messages" history={history.queue}/>
        </material_1.Grid>
        <material_1.Grid item xs={12} md={6}>
          <MetricCard title="Message Latency" value={metrics.avg_message_latency_ms} unit="ms" history={history.latency}/>
        </material_1.Grid>
        <material_1.Grid item xs={12} md={6}>
          <MetricCard title="Memory Usage" value={metrics.avg_memory_usage_mb} unit="MB" history={history.memory}/>
        </material_1.Grid>
        <material_1.Grid item xs={12} md={6}>
          <MetricCard title="CPU Usage" value={metrics.avg_cpu_usage_percent} unit="%" history={history.cpu}/>
        </material_1.Grid>
      </material_1.Grid>

      <material_1.Box sx={{ mt: 3 }}>
        <material_1.Typography variant="h6" gutterBottom>
          System Status
        </material_1.Typography>
        <material_1.Grid container spacing={2}>
          <material_1.Grid item xs={12} md={4}>
            <material_1.Typography variant="body1">
              Uptime: {(metrics.uptime_seconds / 3600).toFixed(2)} hours
            </material_1.Typography>
          </material_1.Grid>
          <material_1.Grid item xs={12} md={4}>
            <material_1.Typography variant="body1" color={metrics.total_errors > 0 ? 'error' : 'success'}>
              Total Errors: {metrics.total_errors}
            </material_1.Typography>
          </material_1.Grid>
          <material_1.Grid item xs={12} md={4}>
            <material_1.Typography variant="body1" color={connected ? 'success' : 'error'}>
              Status: {connected ? 'Connected' : 'Disconnected'}
            </material_1.Typography>
          </material_1.Grid>
        </material_1.Grid>
      </material_1.Box>
    </material_1.Box>);
};
exports.default = PerformanceDashboard;
export {};
//# sourceMappingURL=PerformanceDashboard.js.map