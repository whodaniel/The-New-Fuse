"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMetrics = PerformanceMetrics;
import react_1 from 'react';
import card_1 from '@/components/ui/card';
import recharts_1 from 'recharts';
import websocket_1 from '../services/websocket.js';
function PerformanceMetrics() {
    const [performanceData, setPerformanceData] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const handlePerformanceUpdate = (data) => {
            setPerformanceData(prevData => [...prevData.slice(-19), data]);
        };
        websocket_1.webSocketService.on('performanceUpdate', handlePerformanceUpdate);
        return () => {
            websocket_1.webSocketService.off('performanceUpdate', handlePerformanceUpdate);
        };
    }, []);
    return (<card_1.Card className="w-full h-[300px]">
      <card_1.CardHeader>
        <card_1.CardTitle>Performance Metrics</card_1.CardTitle>
      </card_1.CardHeader>
      <card_1.CardContent>
        <recharts_1.ResponsiveContainer width="100%" height="100%">
          <recharts_1.LineChart data={performanceData}>
            <recharts_1.CartesianGrid strokeDasharray="3 3"/>
            <recharts_1.XAxis dataKey="timestamp" tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}/>
            <recharts_1.YAxis yAxisId="left"/>
            <recharts_1.YAxis yAxisId="right" orientation="right"/>
            <recharts_1.Tooltip labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}/>
            <recharts_1.Line yAxisId="left" type="monotone" dataKey="cpuUsage" stroke="#8884d8" name="CPU Usage (%)"/>
            <recharts_1.Line yAxisId="left" type="monotone" dataKey="memoryUsage" stroke="#82ca9d" name="Memory Usage (%)"/>
            <recharts_1.Line yAxisId="right" type="monotone" dataKey="activeAgents" stroke="#ffc658" name="Active Agents"/>
          </recharts_1.LineChart>
        </recharts_1.ResponsiveContainer>
      </card_1.CardContent>
    </card_1.Card>);
}
export {};
//# sourceMappingURL=performance-metrics.js.map