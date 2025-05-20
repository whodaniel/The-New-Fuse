"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
import components_1 from '../components.js';
import material_1 from '@mui/material';
import react_chartjs_2_1 from 'react-chartjs-2';
import chart_js_1 from 'chart.js';
chart_js_1.Chart.register(chart_js_1.CategoryScale, chart_js_1.LinearScale, chart_js_1.PointElement, chart_js_1.LineElement, chart_js_1.BarElement, chart_js_1.Title, chart_js_1.Tooltip, chart_js_1.Legend);
const Analytics = () => {
    const [timeRange, setTimeRange] = react_1.default.useState('24h');
    const [activeTab, setActiveTab] = react_1.default.useState(0);
    const performanceData = {
        labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
        datasets: [
            {
                label: 'Response Time (ms)',
                data: [150, 230, 180, 400, 280, 250],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
            },
        ],
    };
    const resourceUsageData = {
        labels: ['CPU', 'Memory', 'GPU', 'Network'],
        datasets: [
            {
                label: 'Usage %',
                data: [65, 78, 45, 88],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                ],
            },
        ],
    };
    return (<div className="p-6">
      <material_1.Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <material_1.Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <material_1.Tab label="Performance"/>
          <material_1.Tab label="Resources"/>
          <material_1.Tab label="Knowledge Graph"/>
          <material_1.Tab label="Task Analysis"/>
        </material_1.Tabs>
      </material_1.Box>

      {activeTab === 0 && (<material_1.Grid container spacing={3}>
          <material_1.Grid item xs={12}>
            <material_1.Paper className="p-4">
              <h2 className="text-xl font-bold mb-4">System Performance</h2>
              <components_1.PerformanceMetrics />
              <div className="mt-4 h-80">
                <react_chartjs_2_1.Line data={performanceData} options={{ maintainAspectRatio: false }}/>
              </div>
            </material_1.Paper>
          </material_1.Grid>
        </material_1.Grid>)}

      {activeTab === 1 && (<material_1.Grid container spacing={3}>
          <material_1.Grid item xs={12}>
            <material_1.Paper className="p-4">
              <h2 className="text-xl font-bold mb-4">Resource Usage</h2>
              <components_1.SystemMetrics />
              <div className="mt-4 h-80">
                <react_chartjs_2_1.Bar data={resourceUsageData} options={{ maintainAspectRatio: false }}/>
              </div>
            </material_1.Paper>
          </material_1.Grid>
        </material_1.Grid>)}

      {activeTab === 2 && (<material_1.Grid container spacing={3}>
          <material_1.Grid item xs={12}>
            <material_1.Paper className="p-4">
              <h2 className="text-xl font-bold mb-4">Knowledge Graph Analysis</h2>
              <components_1.DynamicKnowledgeGraph />
            </material_1.Paper>
          </material_1.Grid>
        </material_1.Grid>)}

      {activeTab === 3 && (<material_1.Grid container spacing={3}>
          <material_1.Grid item xs={12}>
            <material_1.Paper className="p-4">
              <h2 className="text-xl font-bold mb-4">Task Allocation Analysis</h2>
              <components_1.PredictiveTaskAllocator />
            </material_1.Paper>
          </material_1.Grid>
        </material_1.Grid>)}
    </div>);
};
exports.default = Analytics;
export {};
//# sourceMappingURL=Analytics.js.map