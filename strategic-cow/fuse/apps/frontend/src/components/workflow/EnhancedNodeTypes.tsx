/**
 * Enhanced Node Types for The New Fuse Workflow Builder
 * Includes: Agent Nodes, Conditional Logic, Parallel Execution, Human Approval
 */

import React from 'react';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiCpu,
  FiGitBranch,
  FiGrid,
  FiPause,
  FiPlay,
  FiUser,
  FiUsers,
} from 'react-icons/fi';
import { Handle, Position } from 'reactflow';
import { Badge } from '../../components/ui/design-system';
import { Tooltip } from '../../components/ui/tooltip';

// Base Node Component
interface BaseNodeProps {
  data: {
    label: string;
    description?: string;
    status?: 'idle' | 'running' | 'completed' | 'error' | 'waiting';
    progress?: number;
    [key: string]: any;
  };
  selected?: boolean;
}

// Agent Task Node
export const AgentTaskNode: React.FC<BaseNodeProps> = ({ data, selected }) => {
  const getStatusColor = () => {
    switch (data.status) {
      case 'running':
        return 'blue';
      case 'completed':
        return 'green';
      case 'error':
        return 'red';
      case 'waiting':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = () => {
    switch (data.status) {
      case 'running':
        return FiPlay;
      case 'completed':
        return FiCheckCircle;
      case 'error':
        return FiAlertCircle;
      case 'waiting':
        return FiPause;
      default:
        return FiCpu;
    }
  };

  return (
    <div
      className={`bg-purple-50 border-2 rounded-md shadow-md min-w-[200px] max-w-[300px] ${selected ? 'border-purple-500 shadow-lg' : 'border-purple-200'}`}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#805AD5' }} />

      <div className="p-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">
              <FiCpu className="w-3 h-3" />
            </div>
            <div className="flex flex-col flex-1">
              <div className="text-sm font-bold text-purple-900">{data.label}</div>
              {data.agentName && (
                <div className="text-xs text-purple-600">Agent: {data.agentName}</div>
              )}
            </div>
            {data.status && (
              <Tooltip label={data.status}>
                <div className={`text-${getStatusColor()}-500`}>
                  {React.createElement(getStatusIcon(), { className: 'w-4 h-4' })}
                </div>
              </Tooltip>
            )}
          </div>

          {data.description && (
            <div className="text-xs text-gray-600 line-clamp-2">{data.description}</div>
          )}

          {data.status === 'running' && data.progress !== undefined && (
            <div>
              <div className="flex justify-between mb-1">
                <div className="text-xs text-gray-600">Progress</div>
                <div className="text-xs text-gray-600">{data.progress}%</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div
                  className={`bg-${getStatusColor()}-500 h-1 rounded-full`}
                  style={{ width: `${data.progress}%` }}
                />
              </div>
            </div>
          )}

          {data.estimatedTime && (
            <div className="flex items-center gap-1">
              <FiClock className="w-3 h-3 text-gray-500" />
              <div className="text-xs text-gray-600">~{data.estimatedTime}min</div>
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: '#805AD5' }} />
    </div>
  );
};

// Conditional Logic Node
export const ConditionalNode: React.FC<BaseNodeProps> = ({ data, selected }) => {
  return (
    <div
      className={`bg-orange-50 border-2 rounded-md shadow-md min-w-[180px] ${selected ? 'border-orange-500 shadow-lg' : 'border-orange-200'} relative`}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#DD6B20' }} />

      <div className="p-3">
        <div className="flex flex-col gap-2 items-center">
          <FiGitBranch className="w-5 h-5 text-orange-600" />
          <div className="text-sm font-bold text-orange-900 text-center">{data.label}</div>
          {data.condition && (
            <Badge variant="warning" size="sm" className="text-center">
              {data.condition}
            </Badge>
          )}
          {data.description && (
            <div className="text-xs text-gray-600 text-center line-clamp-2">{data.description}</div>
          )}
        </div>
      </div>

      {/* Multiple output handles for true/false branches */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ background: '#48BB78', top: '30%' }}
      />
      <div className="absolute right-[-35px] top-[25%] text-xs text-green-600 font-bold">True</div>

      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ background: '#F56565', top: '70%' }}
      />
      <div className="absolute right-[-38px] top-[65%] text-xs text-red-600 font-bold">False</div>
    </div>
  );
};

// Parallel Execution Node
export const ParallelNode: React.FC<BaseNodeProps> = ({ data, selected }) => {
  return (
    <div
      className={`bg-cyan-50 border-2 rounded-md shadow-md min-w-[200px] ${selected ? 'border-cyan-500 shadow-lg' : 'border-cyan-200'}`}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#0BC5EA' }} />

      <div className="p-3">
        <div className="flex flex-col gap-2 items-center">
          <FiGrid className="w-5 h-5 text-cyan-600" />
          <div className="text-sm font-bold text-cyan-900 text-center">{data.label}</div>
          {data.parallelTasks && (
            <Badge variant="primary" size="sm">
              {data.parallelTasks} parallel tasks
            </Badge>
          )}
          {data.description && (
            <div className="text-xs text-gray-600 text-center line-clamp-2">{data.description}</div>
          )}
          {data.status === 'running' && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
              <div className="text-xs text-cyan-600">Executing in parallel</div>
            </div>
          )}
        </div>
      </div>

      {/* Multiple output handles for parallel branches */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output-1"
        style={{ background: '#0BC5EA', left: '25%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="output-2"
        style={{ background: '#0BC5EA', left: '50%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="output-3"
        style={{ background: '#0BC5EA', left: '75%' }}
      />
    </div>
  );
};

// Human Approval Node
export const HumanApprovalNode: React.FC<BaseNodeProps> = ({ data, selected }) => {
  return (
    <div
      className={`bg-pink-50 border-2 rounded-md shadow-md min-w-[200px] ${selected ? 'border-pink-500 shadow-lg' : 'border-pink-200'}`}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#D53F8C' }} />

      <div className="p-3">
        <div className="flex flex-col gap-2 items-center">
          <FiUser className="w-5 h-5 text-pink-600" />
          <div className="text-sm font-bold text-pink-900 text-center">{data.label}</div>
          {data.approvers && (
            <div className="flex items-center gap-1">
              <FiUsers className="w-3 h-3 text-pink-500" />
              <div className="text-xs text-pink-600">{data.approvers} approver(s)</div>
            </div>
          )}
          {data.status === 'waiting' && (
            <Badge variant="warning" size="sm">
              Waiting for approval
            </Badge>
          )}
          {data.status === 'completed' && (
            <Badge variant="success" size="sm">
              ✓ Approved
            </Badge>
          )}
          {data.description && (
            <div className="text-xs text-gray-600 text-center line-clamp-2">{data.description}</div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: '#D53F8C' }} />
    </div>
  );
};

// Multi-Agent Coordination Node
export const MultiAgentNode: React.FC<BaseNodeProps> = ({ data, selected }) => {
  return (
    <div
      className={`bg-teal-50 border-2 rounded-md shadow-md min-w-[220px] ${selected ? 'border-teal-500 shadow-lg' : 'border-teal-200'}`}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#319795' }} />

      <div className="p-3">
        <div className="flex flex-col gap-2 items-center">
          <FiUsers className="w-5 h-5 text-teal-600" />
          <div className="text-sm font-bold text-teal-900 text-center">{data.label}</div>
          {data.agents && (
            <div className="flex flex-wrap gap-1">
              {data.agents.slice(0, 3).map((agent: string, idx: number) => (
                <Badge key={idx} variant="primary" size="sm">
                  {agent}
                </Badge>
              ))}
              {data.agents.length > 3 && (
                <Badge variant="primary" size="sm">
                  +{data.agents.length - 3}
                </Badge>
              )}
            </div>
          )}
          {data.description && (
            <div className="text-xs text-gray-600 text-center line-clamp-2">{data.description}</div>
          )}
          {data.status === 'running' && data.activeAgent && (
            <div className="text-xs text-teal-600">Active: {data.activeAgent}</div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: '#319795' }} />
    </div>
  );
};

// Export all node types
export const enhancedNodeTypes = {
  agentTask: AgentTaskNode,
  conditional: ConditionalNode,
  parallel: ParallelNode,
  humanApproval: HumanApprovalNode,
  multiAgent: MultiAgentNode,
};
