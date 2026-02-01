import React from 'react';
import {
  useAgentBridge,
  useExtensionBridge,
  useMCPBridge,
  useRelay,
  useWorkflowBridge,
} from '../bridges';
import { BridgeConnectionStatus } from '../bridges/components/BridgeConnectionStatus';

const StateCard = ({
  title,
  state,
  onRefresh,
}: {
  title: string;
  state: any;
  onRefresh: () => void;
}) => (
  <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 space-y-2">
    <div className="flex justify-between items-center">
      <h3 className="font-semibold text-white">{title}</h3>
      <button
        onClick={onRefresh}
        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded transition-colors text-white"
      >
        Refresh
      </button>
    </div>

    <div className="grid grid-cols-2 gap-2 text-sm">
      <div className="text-gray-400">Loading:</div>
      <div className={state.loading ? 'text-yellow-400' : 'text-gray-200'}>
        {state.loading.toString()}
      </div>

      <div className="text-gray-400">Error:</div>
      <div className="text-red-400">{state.error ? state.error.message : 'None'}</div>

      <div className="text-gray-400">Last Updated:</div>
      <div className="text-gray-200">
        {state.lastUpdated ? new Date(state.lastUpdated).toLocaleTimeString() : 'Never'}
      </div>

      <div className="text-gray-400">Data Count:</div>
      <div className="text-emerald-400 font-mono">
        {Array.isArray(state.data) ? state.data.length : state.data ? 'Present' : 'Null'}
      </div>
    </div>

    <pre className="mt-2 p-2 bg-slate-900 rounded text-xs text-green-400 overflow-auto max-h-32">
      {JSON.stringify(state.data, null, 2)}
    </pre>
  </div>
);

export const BridgeDiagnosticDashboard: React.FC = () => {
  const { connectionState } = useRelay();

  const { activeAgents, refreshAgents } = useAgentBridge();
  const { workflows, activeExecution, refreshWorkflows } = useWorkflowBridge();
  const { activeServers, availableTools, refreshServers } = useMCPBridge();
  const { extensions, refreshExtensions } = useExtensionBridge();

  return (
    <div className="p-8 space-y-8 bg-slate-950 min-h-screen text-slate-200">
      <div className="flex justify-between items-end border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Bridge Layer Diagnostics</h1>
          <p className="text-gray-400">Verifying Pillars I, II, III, and V integration.</p>
        </div>
        <BridgeConnectionStatus />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Pillar I: Agents */}
        <StateCard title="Pillar I: Active Agents" state={activeAgents} onRefresh={refreshAgents} />

        {/* Pillar II: Workflows */}
        <StateCard title="Pillar II: Workflows" state={workflows} onRefresh={refreshWorkflows} />
        <StateCard
          title="Pillar II: Execution"
          state={activeExecution}
          onRefresh={refreshWorkflows}
        />

        {/* Pillar III: MCP */}
        <StateCard
          title="Pillar III: MCP Servers"
          state={activeServers}
          onRefresh={refreshServers}
        />
        <StateCard title="Pillar III: Tools" state={availableTools} onRefresh={refreshServers} />

        {/* Pillar V: Extensions */}
        <StateCard title="Pillar V: Extensions" state={extensions} onRefresh={refreshExtensions} />
      </div>

      <div className="p-4 bg-slate-900 rounded border border-slate-800">
        <h3 className="font-semibold text-white mb-2">Raw Connection State</h3>
        <pre className="text-xs text-blue-300 font-mono">
          {JSON.stringify(connectionState, null, 2)}
        </pre>
      </div>
    </div>
  );
};
