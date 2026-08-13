import React from 'react';

interface AgentDetailsProps {
  name: string;
  status: string;
  avatar?: string;
  performance: number;
  capabilities: string[];
  model: string;
}

const AgentDetails: React.FC<AgentDetailsProps> = ({
  name,
  status,
  avatar,
  performance,
  capabilities,
  model,
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-green-500';
      case 'idle':
        return 'text-yellow-500';
      case 'offline':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 80) return 'bg-green-500';
    if (performance >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 items-center">
        {avatar ? (
          <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl font-bold text-muted-foreground dark:text-muted-foreground">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex flex-col items-start gap-1">
          <p className="font-bold text-lg text-gray-900 dark:text-gray-100">{name}</p>
          <p className={`text-sm ${getStatusColor(status)} font-medium`}>{status}</p>
        </div>
      </div>

      <div>
        <p className="text-sm mb-1 text-foreground dark:text-gray-300">Performance</p>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${getPerformanceColor(performance)}`}
            style={{ width: `${performance}%` }}
          />
        </div>
      </div>

      <div>
        <p className="text-sm mb-2 text-foreground dark:text-gray-300">Capabilities</p>
        <div className="flex flex-wrap gap-2">
          {capabilities.map((capability) => (
            <span
              key={capability}
              className="text-xs bg-gray-100 dark:bg-gray-700 text-foreground dark:text-gray-300 px-2 py-1 rounded-full"
            >
              {capability}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm mb-1 text-foreground dark:text-gray-300">Model</p>
        <p className="text-xs text-muted-foreground dark:text-muted-foreground">{model}</p>
      </div>
    </div>
  );
};

export default AgentDetails;
