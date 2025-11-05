import React from 'react';

export function Dashboard() {
  const stats = [
    {
      label: 'Total Users',
      value: '5,000',
      change: '↑ 23%',
    },
    {
      label: 'Active Projects',
      value: '120',
      change: '↑ 15%',
    },
    {
      label: 'Total Revenue',
      value: '$50K',
      change: '↓ 5%',
    },
    {
      label: 'Success Rate',
      value: '88%',
      change: '↑ 10%',
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <div>
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="p-4 bg-white dark:bg-gray-700 rounded-lg shadow-md">
              <div className="stat">
                <div className="stat-label">{stat.label}</div>
                <div className="stat-number">{stat.value}</div>
                <div className="stat-help-text">{stat.change}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow-md">
            <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
            <p className="text-gray-500">No recent activity</p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow-md">
            <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
            <p className="text-gray-500">No actions available</p>
          </div>
        </div>
      </div>
    </div>
  );
}