import React from 'react';
import { useParams } from 'react-router-dom';

interface MemoryInspectorProps {
  agentId?: string;
}

/**
 * Memory Inspector - View agent memory and context
 */
const MemoryInspector: React.FC<MemoryInspectorProps> = ({ agentId: propAgentId }) => {
  const { agentId: paramAgentId } = useParams();
  const agentId = propAgentId || paramAgentId || 'default';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Memory Inspector</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Agent ID:{' '}
          <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm">
            {agentId}
          </span>
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Memory Context</h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-600 dark:text-gray-400 italic">
            No memory entries found for this agent.
          </p>
          <div className="flex gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              Short-term Memory
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
              Long-term Memory
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryInspector;
