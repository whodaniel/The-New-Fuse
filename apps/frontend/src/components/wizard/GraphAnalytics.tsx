
export {}
exports.GraphAnalytics = GraphAnalytics;
import react_1 from 'react';
import material_1 from '@mui/material';
import recharts_1 from 'recharts';
import WizardProvider_1 from './WizardProvider.js';
import WizardWebSocket_1 from './WizardWebSocket.js';
function GraphAnalytics(): any {
    const { state } = (0, WizardProvider_1.useWizard)();
    const { subscribeToEvent, unsubscribeFromEvent, sendMessage } = (0, WizardWebSocket_1.useWizardWebSocket)();
    const [metrics, setMetrics] = (0, react_1.useState)(null);
    const [nodeDistribution, setNodeDistribution] = (0, react_1.useState)([]);
    const [edgeAnalytics, setEdgeAnalytics] = (0, react_1.useState)([]);
    const [timeseriesData, setTimeseriesData] = (0, react_1.useState)([]);
    const [selectedTab, setSelectedTab] = (0, react_1.useState)(0);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [selectedTimeRange, setSelectedTimeRange] = (0, react_1.useState)('1h');
    const [selectedMetric, setSelectedMetric] = (0, react_1.useState)('nodeCount');
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
    (0, react_1.useEffect)(() => {
        const handleMetricsUpdate = (data): any => {
            setMetrics(data.metrics);
            setNodeDistribution(data.nodeDistribution);
            setEdgeAnalytics(data.edgeAnalytics);
            setTimeseriesData((prev: any) => [...prev, {
                    timestamp: Date.now(),
                    nodeCount: data.metrics.nodeCount,
                    edgeCount: data.metrics.edgeCount,
                    avgDegree: data.metrics.avgDegree
                }].slice(-100));
        };
        subscribeToEvent('graph_metrics', handleMetricsUpdate);
        sendMessage('request_graph_metrics', { timeRange: selectedTimeRange });
        setLoading(false);
        return () => unsubscribeFromEvent('graph_metrics', handleMetricsUpdate);
    }, [subscribeToEvent, unsubscribeFromEvent, sendMessage]);
    const handleTimeRangeChange = (range): any => {
        setSelectedTimeRange(range);
        sendMessage('request_graph_metrics', { timeRange: range });
    };
    const renderMetricsOverview = (): any => (<material_1.Grid container spacing={2}>
            <material_1.Grid item xs={12} md={6}>
                <material_1.Card>
                    <material_1.CardContent>
                        <material_1.Typography variant="h6" gutterBottom>Graph Overview</material_1.Typography>
                        {metrics && (<material_1.Box>
                                <material_1.Typography>Nodes: {metrics.nodeCount}</material_1.Typography>
                                <material_1.Typography>Edges: {metrics.edgeCount}</material_1.Typography>
                                <material_1.Typography>Density: {metrics.density.toFixed(3)}</material_1.Typography>
                                <material_1.Typography>Average Degree: {metrics.avgDegree.toFixed(2)}</material_1.Typography>
                                <material_1.Typography>Clustering Coefficient: {metrics.clustering.toFixed(3)}</material_1.Typography>
                                <material_1.Typography>Connected Components: {metrics.componentCount}</material_1.Typography>
                                <material_1.Typography>Graph Diameter: {metrics.diameter}</material_1.Typography>
                                <material_1.Typography>Avg Path Length: {metrics.avgPathLength.toFixed(2)}</material_1.Typography>
                            </material_1.Box>)}
                    </material_1.CardContent>
                </material_1.Card>
            </material_1.Grid>
            <material_1.Grid item xs={12} md={6}>
                <material_1.Card>
                    <material_1.CardContent>
                        <material_1.Typography variant="h6" gutterBottom>Node Distribution</material_1.Typography>
                        <recharts_1.ResponsiveContainer width="100%" height={300}>
                            <recharts_1.PieChart>
                                <recharts_1.Pie data={nodeDistribution} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80} label>
                                    {nodeDistribution.map((entry, index) => (<recharts_1.Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>))}
                                </recharts_1.Pie>
                                <recharts_1.Legend />
                                <recharts_1.Tooltip />
                            </recharts_1.PieChart>
                        </recharts_1.ResponsiveContainer>
                    </material_1.CardContent>
                </material_1.Card>
            </material_1.Grid>
        </material_1.Grid>);
    const renderEdgeAnalytics = (): any => (<material_1.Card>
            <material_1.CardContent>
                <material_1.Typography variant="h6" gutterBottom>Edge Analytics</material_1.Typography>
                <recharts_1.ResponsiveContainer width="100%" height={400}>
                    <recharts_1.BarChart data={edgeAnalytics}>
                        <recharts_1.CartesianGrid strokeDasharray="3 3"/>
                        <recharts_1.XAxis dataKey="type"/>
                        <recharts_1.YAxis yAxisId="left" orientation="left" stroke="#8884d8"/>
                        <recharts_1.YAxis yAxisId="right" orientation="right" stroke="#82ca9d"/>
                        <recharts_1.Tooltip />
                        <recharts_1.Legend />
                        <recharts_1.Bar yAxisId="left" dataKey="count" fill="#8884d8" name="Count"/>
                        <recharts_1.Bar yAxisId="right" dataKey="weight" fill="#82ca9d" name="Avg Weight"/>
                    </recharts_1.BarChart>
                </recharts_1.ResponsiveContainer>
            </material_1.CardContent>
        </material_1.Card>);
    const renderTimeseries = (): any => (<material_1.Card>
            <material_1.CardContent>
                <material_1.Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <material_1.Typography variant="h6">Time Series Analysis</material_1.Typography>
                    <material_1.Box display="flex" gap={2}>
                        <material_1.FormControl size="small">
                            <material_1.InputLabel>Time Range</material_1.InputLabel>
                            <material_1.Select value={selectedTimeRange} onChange={(e) => handleTimeRangeChange(e.target.value)} label="Time Range">
                                <material_1.MenuItem value="1h">Last Hour</material_1.MenuItem>
                                <material_1.MenuItem value="24h">Last 24 Hours</material_1.MenuItem>
                                <material_1.MenuItem value="7d">Last 7 Days</material_1.MenuItem>
                                <material_1.MenuItem value="30d">Last 30 Days</material_1.MenuItem>
                            </material_1.Select>
                        </material_1.FormControl>
                        <material_1.FormControl size="small">
                            <material_1.InputLabel>Metric</material_1.InputLabel>
                            <material_1.Select value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value)} label="Metric">
                                <material_1.MenuItem value="nodeCount">Node Count</material_1.MenuItem>
                                <material_1.MenuItem value="edgeCount">Edge Count</material_1.MenuItem>
                                <material_1.MenuItem value="avgDegree">Average Degree</material_1.MenuItem>
                            </material_1.Select>
                        </material_1.FormControl>
                    </material_1.Box>
                </material_1.Box>
                <recharts_1.ResponsiveContainer width="100%" height={400}>
                    <recharts_1.LineChart data={timeseriesData}>
                        <recharts_1.CartesianGrid strokeDasharray="3 3"/>
                        <recharts_1.XAxis dataKey="timestamp" tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}/>
                        <recharts_1.YAxis />
                        <recharts_1.Tooltip labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}/>
                        <recharts_1.Legend />
                        <recharts_1.Line type="monotone" dataKey={selectedMetric} stroke="#8884d8" dot={false} name={selectedMetric}/>
                    </recharts_1.LineChart>
                </recharts_1.ResponsiveContainer>
            </material_1.CardContent>
        </material_1.Card>);
    if (loading) {
        return (<material_1.Box display="flex" justifyContent="center" alignItems="center" height={400}>
                <material_1.CircularProgress />
            </material_1.Box>);
    }
    return (<material_1.Box>
            <material_1.Paper sx={{ mb: 2 }}>
                <material_1.Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)} variant="fullWidth">
                    <material_1.Tab label="Overview"/>
                    <material_1.Tab label="Edge Analytics"/>
                    <material_1.Tab label="Time Series"/>
                </material_1.Tabs>
            </material_1.Paper>

            <material_1.Box mt={2}>
                {selectedTab === 0 && renderMetricsOverview()}
                {selectedTab === 1 && renderEdgeAnalytics()}
                {selectedTab === 2 && renderTimeseries()}
            </material_1.Box>
        </material_1.Box>);
}
export {};
//# sourceMappingURL=GraphAnalytics.js.map