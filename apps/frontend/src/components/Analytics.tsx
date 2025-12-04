"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
import components_1 from '../components';
import { Box, SimpleGrid, GridItem, Tabs, Tab, Container, Card, CardBody, CardHeader, Button, Input, Select, Menu, MenuItem, Modal, ModalHeader, ModalBody, ModalFooter } from '@chakra-ui/react';
import react_chartjs_2_1 from 'react-chartjs-2';
import chart_js_1 from 'chart';
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
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Performance"/>
          <Tab label="Resources"/>
          <Tab label="Knowledge Graph"/>
          <Tab label="Task Analysis"/>
        </Tabs>
      </Box>

      {activeTab === 0 && (<SimpleGrid templateColumns={3}>
          <GridItem colSpan={12}>
            <Box className="p-4">
              <h2 className="text-xl font-bold mb-4">System Performance</h2>
              <components_1.PerformanceMetrics />
              <div className="mt-4 h-80">
                <react_chartjs_2_1.Line data={performanceData} options={{ maintainAspectRatio: false }}/>
              </div>
            </Box>
          </SimpleGrid>
        </SimpleGrid>)}

      {activeTab === 1 && (<SimpleGrid templateColumns={3}>
          <GridItem colSpan={12}>
            <Box className="p-4">
              <h2 className="text-xl font-bold mb-4">Resource Usage</h2>
              <components_1.SystemMetrics />
              <div className="mt-4 h-80">
                <react_chartjs_2_1.Bar data={resourceUsageData} options={{ maintainAspectRatio: false }}/>
              </div>
            </Box>
          </SimpleGrid>
        </SimpleGrid>)}

      {activeTab === 2 && (<SimpleGrid templateColumns={3}>
          <GridItem colSpan={12}>
            <Box className="p-4">
              <h2 className="text-xl font-bold mb-4">Knowledge Graph Analysis</h2>
              <components_1.DynamicKnowledgeGraph />
            </Box>
          </GridItem>
        </SimpleGrid>)}

      {activeTab === 3 && (<SimpleGrid templateColumns={3}>
          <GridItem colSpan={12}>
            <Box className="p-4">
              <h2 className="text-xl font-bold mb-4">Task Allocation Analysis</h2>
              <components_1.PredictiveTaskAllocator />
            </Box>
          </SimpleGrid>
        </SimpleGrid>)}
    </div>);
};
exports.default = Analytics;
export {};
