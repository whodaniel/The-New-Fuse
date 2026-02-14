'use client';
import { GlassCard as Card } from '@/components/ui/premium/GlassCard';
import { useState } from 'react';

export function UserDashboard() {
  const [earnings] = useState(0);
  const mockApps = [
    { id: 1, name: 'Cool Chat App', downloads: 100, earnings: 50 },
    { id: 2, name: 'Awesome Todo List', downloads: 200, earnings: 100 },
  ];

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4 text-white">Your Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Total Earnings" gradient="green" className="text-center">
          <p className="text-4xl font-bold text-white">${earnings}</p>
        </Card>
        {mockApps.map((app) => (
          <Card key={app.id} title={app.name} gradient="blue">
            <div className="space-y-2">
              <p className="text-gray-300">Downloads: {app.downloads}</p>
              <p className="text-gray-300">Earnings: ${app.earnings}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
