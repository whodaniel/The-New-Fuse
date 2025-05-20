"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemMetrics = SystemMetrics;
import react_1 from 'react';
import card_1 from '@/components/ui/card';
import recharts_1 from 'recharts';
const data = [
    { name: '00:00', agents: 4000, tasks: 2400, interactions: 2400 },
    { name: '04:00', agents: 3000, tasks: 1398, interactions: 2210 },
    { name: '08:00', agents: 2000, tasks: 9800, interactions: 2290 },
    { name: '12:00', agents: 2780, tasks: 3908, interactions: 2000 },
    { name: '16:00', agents: 1890, tasks: 4800, interactions: 2181 },
    { name: '20:00', agents: 2390, tasks: 3800, interactions: 2500 },
    { name: '23:59', agents: 3490, tasks: 4300, interactions: 2100 },
];
function SystemMetrics() {
    return (<card_1.Card className="w-full max-w-3xl">
      <card_1.CardHeader>
        <card_1.CardTitle>System Metrics</card_1.CardTitle>
      </card_1.CardHeader>
      <card_1.CardContent>
        <recharts_1.ResponsiveContainer width="100%" height={300}>
          <recharts_1.LineChart data={data}>
            <recharts_1.CartesianGrid strokeDasharray="3 3"/>
            <recharts_1.XAxis dataKey="name"/>
            <recharts_1.YAxis />
            <recharts_1.Tooltip />
            <recharts_1.Line type="monotone" dataKey="agents" stroke="#8884d8"/>
            <recharts_1.Line type="monotone" dataKey="tasks" stroke="#82ca9d"/>
            <recharts_1.Line type="monotone" dataKey="interactions" stroke="#ffc658"/>
          </recharts_1.LineChart>
        </recharts_1.ResponsiveContainer>
      </card_1.CardContent>
    </card_1.Card>);
}
export {};
//# sourceMappingURL=system-metrics.js.map