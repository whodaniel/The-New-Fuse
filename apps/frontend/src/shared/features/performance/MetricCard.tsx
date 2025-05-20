import React from 'react';
import { Card } from '@/shared/ui/core/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
export function MetricCard({ title, value, unit, history, color = '#2563eb' }) {
    return (<Card className="h-full">
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-3xl font-bold text-primary">
            {value.toFixed(2)} {unit}
          </p>
        </div>
        
        <div className="h-[100px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200"/>
              <XAxis dataKey="timestamp" tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()} className="text-xs"/>
              <YAxis className="text-xs"/>
              <Tooltip labelFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()} contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '0.375rem'
        }}/>
              <Line type="monotone" dataKey="value" stroke={color} dot={false} strokeWidth={2}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>);
}
//# sourceMappingURL=MetricCard.js.map