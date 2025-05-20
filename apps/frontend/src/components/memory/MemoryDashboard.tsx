"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryDashboard = void 0;
import react_1 from 'react';
import react_chartjs_2_1 from 'react-chartjs-2';
import chart_js_1 from 'chart.js';
chart_js_1.Chart.register(chart_js_1.CategoryScale, chart_js_1.LinearScale, chart_js_1.PointElement, chart_js_1.LineElement, chart_js_1.Title, chart_js_1.Tooltip, chart_js_1.Legend, chart_js_1.ArcElement);
const MemoryDashboard = ({ memoryManager }) => {
    const [metrics, setMetrics] = (0, react_1.useState)(null);
    const [health, setHealth] = (0, react_1.useState)(null);
    const [clusters, setClusters] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const updateMetrics = () => {
            setMetrics(memoryManager.getMetrics());
            setHealth(memoryManager.getHealth());
            setClusters(memoryManager.getClusterInfo());
        };
        updateMetrics();
        const interval = setInterval(updateMetrics, 5000);
        return () => clearInterval(interval);
    }, [memoryManager]);
    if (!metrics || !health)
        return <div>Loading metrics...</div>;
    const memoryUsageData = {
        labels: ['Used', 'Available'],
        datasets: [
            {
                data: [metrics.totalItems, metrics.maxItems - metrics.totalItems],
                backgroundColor: ['#FF6384', '#36A2EB'],
                hoverBackgroundColor: ['#FF6384', '#36A2EB']
            }
        ]
    };
    const performanceData = {
        labels: ['Cache Hit Rate', 'Retrieval Latency'],
        datasets: [
            {
                label: 'Performance Metrics',
                data: [metrics.cacheHitRate * 100, metrics.retrievalLatency],
                borderColor: '#4BC0C0',
                tension: 0.1
            }
        ]
    };
    return (<div className="memory-dashboard">
            <h2>Memory System Dashboard</h2>
            
            <div className="metrics-grid">
                <div className="metric-card">
                    <h3>Memory Usage</h3>
                    <react_chartjs_2_1.Doughnut data={memoryUsageData}/>
                    <div className="metric-details">
                        <p>Total Items: {metrics.totalItems}</p>
                        <p>Max Capacity: {metrics.maxItems}</p>
                    </div>
                </div>

                <div className="metric-card">
                    <h3>Performance</h3>
                    <react_chartjs_2_1.Line data={performanceData}/>
                    <div className="metric-details">
                        <p>Cache Hit Rate: {(metrics.cacheHitRate * 100).toFixed(1)}%</p>
                        <p>Avg Retrieval Time: {metrics.retrievalLatency.toFixed(2)}ms</p>
                    </div>
                </div>

                <div className="metric-card">
                    <h3>System Health</h3>
                    <div className={`health-status ${health.status.toLowerCase()}`}>
                        {health.status}
                    </div>
                    <div className="metric-details">
                        <p>Memory Load: {health.memoryLoad.toFixed(1)}%</p>
                        <p>Cache Efficiency: {health.cacheEfficiency.toFixed(1)}%</p>
                    </div>
                </div>

                <div className="metric-card clusters">
                    <h3>Memory Clusters</h3>
                    <div className="clusters-list">
                        {clusters.map(cluster => (<div key={cluster.id} className="cluster-item">
                                <div className="cluster-header">
                                    <h4>{cluster.label}</h4>
                                    <span className="cluster-size">{cluster.size} items</span>
                                </div>
                                <div className="cluster-confidence">
                                    <div className="confidence-bar" style={{ width: `${cluster.confidence * 100}%` }}/>
                                    <span>{(cluster.confidence * 100).toFixed(1)}% confidence</span>
                                </div>
                            </div>))}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .memory-dashboard {
                    padding: 20px;
                    background: #f5f5f5;
                }

                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }

                .metric-card {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .metric-card h3 {
                    margin-top: 0;
                    color: #333;
                }

                .metric-details {
                    margin-top: 15px;
                }

                .health-status {
                    padding: 10px;
                    border-radius: 4px;
                    text-align: center;
                    font-weight: bold;
                    margin: 10px 0;
                }

                .health-status.healthy {
                    background: #d4edda;
                    color: #155724;
                }

                .health-status.warning {
                    background: #fff3cd;
                    color: #856404;
                }

                .health-status.critical {
                    background: #f8d7da;
                    color: #721c24;
                }

                .clusters-list {
                    max-height: 300px;
                    overflow-y: auto;
                }

                .cluster-item {
                    padding: 10px;
                    border-bottom: 1px solid #eee;
                }

                .cluster-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .cluster-header h4 {
                    margin: 0;
                    color: #333;
                }

                .cluster-size {
                    color: #666;
                    font-size: 0.9em;
                }

                .cluster-confidence {
                    margin-top: 5px;
                    position: relative;
                    height: 20px;
                    background: #f0f0f0;
                    border-radius: 10px;
                    overflow: hidden;
                }

                .confidence-bar {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    background: linear-gradient(90deg, #4BC0C0 0%, #36A2EB 100%);
                    transition: width 0.3s ease;
                }

                .cluster-confidence span {
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    font-size: 0.8em;
                    color: #333;
                    z-index: 1;
                }
            `}</style>
        </div>);
};
exports.MemoryDashboard = MemoryDashboard;
export {};
//# sourceMappingURL=MemoryDashboard.js.map