'use client';
import { GlassCard as Card } from '@/components/ui/premium/GlassCard';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const data = [
  { name: '00:00', agents: 4000, tasks: 2400, interactions: 2400 },
  { name: '04:00', agents: 3000, tasks: 1398, interactions: 2210 },
  { name: '08:00', agents: 2000, tasks: 9800, interactions: 2290 },
  { name: '12:00', agents: 2780, tasks: 3908, interactions: 2000 },
  { name: '16:00', agents: 1890, tasks: 4800, interactions: 2181 },
  { name: '20:00', agents: 2390, tasks: 3800, interactions: 2500 },
  { name: '23:59', agents: 3490, tasks: 4300, interactions: 2100 },
];

export function SystemMetrics() {
  return (
    <Card title="System Metrics" gradient="green" className="w-full max-w-3xl">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
          <YAxis stroke="rgba(255,255,255,0.5)" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />
          <Line type="monotone" dataKey="agents" stroke="#8884d8" name="Agents" />
          <Line type="monotone" dataKey="tasks" stroke="#82ca9d" name="Tasks" />
          <Line type="monotone" dataKey="interactions" stroke="#ffc658" name="Interactions" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
