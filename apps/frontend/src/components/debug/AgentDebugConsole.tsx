import React from 'react';
import { Console } from '@/components/ui/console';
import { Timeline } from '@/components/ui/timeline';

export const AgentDebugConsole: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('1h');

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between p-4">
        <AgentSelector
          value={selectedAgent}
          onChange={setSelectedAgent}
        />
        <TimeRangeSelector
          value={timeRange}
          onChange={setTimeRange}
        />
      </div>

      <div className="flex-1 grid grid-cols-2">
        <Console
          agentId={selectedAgent}
          filters={{
            level: ['error', 'warn', 'info', 'debug'],
            timeRange
          }}
          onCommand={(cmd) => {/* Execute debug command */}}
        />
        
        <Timeline
          agentId={selectedAgent}
          timeRange={timeRange}
          events={[
            'decisions',
            'actions',
            'state_changes',
            'errors'
          ]}
        />
      </div>
    </div>
  );
};