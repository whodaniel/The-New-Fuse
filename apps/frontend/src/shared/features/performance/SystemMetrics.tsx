import React from 'react';
import { Card } from '@/shared/ui/core/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
const defaultData = [
    { name: '00:00', agents: 4000, tasks: 2400, interactions: 2400 },
    { name: '04:00', agents: 3000, tasks: 1398, interactions: 2210 },
    { name: '08:00', agents: 2000, tasks: 9800, interactions: 2290 },
    { name: '12:00', agents: 2780, tasks: 3908, interactions: 2000 },
    { name: '16:00', agents: 1890, tasks: 4800, interactions: 2181 },
    { name: '20:00', agents: 2390, tasks: 3800, interactions: 2500 },
    { name: '23:59', agents: 3490, tasks: 4300, interactions: 2100 },
];
export function SystemMetrics({ data = defaultData, className }) {
    return (<Card className={className}>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">System Metrics</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200"/>
              <XAxis dataKey="name" className="text-xs"/>
              <YAxis className="text-xs"/>
              <Tooltip contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '0.375rem'
        }}/>
              <Line type="monotone" dataKey="agents" stroke="#8884d8" name="Active Agents" strokeWidth={2}/>
              <Line type="monotone" dataKey="tasks" stroke="#82ca9d" name="Completed Tasks" strokeWidth={2}/>
              <Line type="monotone" dataKey="interactions" stroke="#ffc658" name="Agent Interactions" strokeWidth={2}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>);
}
//# sourceMappingURL=SystemMetrics.js.map