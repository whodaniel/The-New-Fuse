// @ts-nocheck
import { MassBlockType } from '@the-new-fuse/types';
import React, { useEffect, useState } from 'react';
import {
  FiChevronDown,
  FiChevronRight,
  FiMessageSquare,
  FiPlay,
  FiRefreshCw,
  FiTool,
  FiUsers,
  FiZap,
} from 'react-icons/fi';
import { useMassExecution } from '../../hooks/useMassExecution';
import { Button } from '../../ui/design-system';

interface MassBlockExecutorProps {
  availableAgents: Array<{ id: string; name: string; type: string }>;
  onExecutionComplete?: (result: any) => void;
}

export const MassBlockExecutor: React.FC<MassBlockExecutorProps> = ({
  availableAgents,
  onExecutionComplete,
}) => {
  const [selectedBlock, setSelectedBlock] = useState<MassBlockType>('aggregate');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [blockConfig, setBlockConfig] = useState<any>({});
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [openConfig, setOpenConfig] = useState<Record<string, boolean>>({});

  const { executeAggregate, executeReflect, executeDebate, loading, error } = useMassExecution();

  useEffect(() => {
    if (error) {
      alert(`Execution Error: ${error}`);
    }
  }, [error]);

  const toggleConfig = (key: string) => {
    setOpenConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const blockTypes = [
    {
      type: 'aggregate' as MassBlockType,
      name: 'Aggregate',
      description: 'Parallel execution with result aggregation',
      icon: FiUsers,
      color: 'text-blue-500 bg-blue-50 border-blue-200 hover:border-blue-300',
    },
    {
      type: 'reflect' as MassBlockType,
      name: 'Reflect',
      description: 'Iterative refinement through reflection',
      icon: FiRefreshCw,
      color: 'text-green-500 bg-green-50 border-green-200 hover:border-green-300',
    },
    {
      type: 'debate' as MassBlockType,
      name: 'Debate',
      description: 'Multi-agent debate for robust decisions',
      icon: FiMessageSquare,
      color: 'text-purple-500 bg-purple-50 border-purple-200 hover:border-purple-300',
    },
    {
      type: 'custom' as MassBlockType,
      name: 'Custom',
      description: 'Task-specific custom agents',
      icon: FiZap,
      color: 'text-orange-500 bg-orange-50 border-orange-200 hover:border-orange-300',
    },
    {
      type: 'tool_use' as MassBlockType,
      name: 'Tool Use',
      description: 'External tool integration',
      icon: FiTool,
      color: 'text-teal-500 bg-teal-50 border-teal-200 hover:border-teal-300',
    },
  ];

  const handleExecute = async () => {
    if (!input.trim() || selectedAgents.length === 0) {
      alert('Invalid Input: Please provide input and select at least one agent');
      return;
    }

    try {
      let result;

      switch (selectedBlock) {
        case 'aggregate':
          result = await executeAggregate(selectedAgents, input, {
            aggregationStrategy: blockConfig.aggregationStrategy || 'majority_vote',
            parallelExecution: blockConfig.parallelExecution !== false,
          });
          break;

        case 'reflect':
          if (selectedAgents.length < 2) {
            alert('Reflect block requires at least 2 agents (predictor and reflector)');
            return;
          }
          result = await executeReflect(selectedAgents[0], selectedAgents[1], input, {
            maxRounds: blockConfig.maxRounds || 3,
          });
          break;

        case 'debate':
          if (selectedAgents.length < 2) {
            alert('Debate block requires at least 2 agents');
            return;
          }
          result = await executeDebate(selectedAgents, input, {
            debateRounds: blockConfig.debateRounds || 3,
            votingStrategy: blockConfig.votingStrategy || 'majority',
          });
          break;

        default:
          alert(`${selectedBlock} block execution not yet implemented`);
          return;
      }

      setExecutionResult(result);
      onExecutionComplete?.(result);

      // alert(`${selectedBlock} block executed successfully`);
    } catch (err) {
      console.error('Execution failed:', err);
    }
  };

  const renderBlockConfiguration = () => {
    switch (selectedBlock) {
      case 'aggregate':
        return (
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Aggregation Strategy</label>
              <select
                value={blockConfig.aggregationStrategy || 'majority_vote'}
                onChange={(e) =>
                  setBlockConfig({ ...blockConfig, aggregationStrategy: e.target.value })
                }
                className="input w-full"
              >
                <option value="majority_vote">Majority Vote</option>
                <option value="weighted_average">Weighted Average</option>
                <option value="consensus">Consensus</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Parallel Execution</label>
              <input
                type="checkbox"
                checked={blockConfig.parallelExecution !== false}
                onChange={(e) =>
                  setBlockConfig({ ...blockConfig, parallelExecution: e.target.checked })
                }
                className="toggle"
              />
            </div>
          </div>
        );

      case 'reflect':
        return (
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Max Rounds</label>
              <input
                type="number"
                value={blockConfig.maxRounds || 3}
                onChange={(e) =>
                  setBlockConfig({ ...blockConfig, maxRounds: parseInt(e.target.value) || 3 })
                }
                min={1}
                max={10}
                className="input w-full"
              />
            </div>

            <div className="p-3 bg-blue-50 text-blue-800 rounded-md text-sm border border-blue-200">
              💡 First selected agent will be the predictor, second will be the reflector
            </div>
          </div>
        );

      case 'debate':
        return (
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Debate Rounds</label>
              <input
                type="number"
                value={blockConfig.debateRounds || 3}
                onChange={(e) =>
                  setBlockConfig({ ...blockConfig, debateRounds: parseInt(e.target.value) || 3 })
                }
                min={1}
                max={10}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Voting Strategy</label>
              <select
                value={blockConfig.votingStrategy || 'majority'}
                onChange={(e) => setBlockConfig({ ...blockConfig, votingStrategy: e.target.value })}
                className="input w-full"
              >
                <option value="majority">Majority</option>
                <option value="weighted">Weighted</option>
                <option value="consensus">Consensus</option>
              </select>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-3 bg-gray-50 text-gray-600 rounded-md text-sm border border-gray-200">
            Configuration for {selectedBlock} block coming soon...
          </div>
        );
    }
  };

  const selectedBlockInfo = blockTypes.find((bt) => bt.type === selectedBlock);

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm bg-white">
      <div className="p-4 border-b border-gray-200 flex items-center gap-2">
        <FiZap className="text-purple-500" />
        <h2 className="text-lg font-semibold">MASS Block Executor</h2>
        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium border border-purple-200">
          Interactive Testing
        </span>
      </div>

      <div className="p-6 flex flex-col gap-6">
        {/* Block Type Selection */}
        <div className="w-full">
          <p className="text-sm font-medium mb-3">Select MASS Building Block</p>
          <div className="flex flex-col gap-2">
            {blockTypes.map((blockType) => (
              <div
                key={blockType.type}
                className={`w-full p-3 border-2 rounded-md cursor-pointer transition-all flex items-center justify-between ${
                  selectedBlock === blockType.type
                    ? blockType.color
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => {
                  setSelectedBlock(blockType.type);
                  setBlockConfig({});
                  setExecutionResult(null);
                }}
              >
                <div className="flex items-center gap-3">
                  <blockType.icon
                    className={selectedBlock === blockType.type ? 'text-inherit' : 'text-gray-400'}
                  />
                  <div>
                    <p className="font-medium">{blockType.name}</p>
                    <p className="text-sm opacity-80">{blockType.description}</p>
                  </div>
                </div>
                {selectedBlock === blockType.type && (
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-white/20">
                    Selected
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200" />

        {/* Agent Selection */}
        <div className="w-full">
          <p className="text-sm font-medium mb-3">
            Select Agents ({selectedAgents.length} selected)
          </p>
          <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-2">
            {availableAgents.map((agent) => {
              const isSelected = selectedAgents.includes(agent.id);
              return (
                <div
                  key={agent.id}
                  className={`w-full p-3 border rounded-md cursor-pointer transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedAgents(selectedAgents.filter((id) => id !== agent.id));
                    } else {
                      setSelectedAgents([...selectedAgents, agent.id]);
                    }
                  }}
                >
                  <div>
                    <p className="font-medium">{agent.name}</p>
                    <p className="text-sm text-gray-600">{agent.type}</p>
                  </div>
                  {isSelected && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      Selected
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-gray-200" />

        {/* Block Configuration */}
        {selectedBlockInfo && (
          <div className="w-full">
            <div className="flex items-center gap-2 mb-3">
              <selectedBlockInfo.icon className="text-gray-500" />
              <p className="text-sm font-medium">{selectedBlockInfo.name} Configuration</p>
            </div>
            {renderBlockConfiguration()}
          </div>
        )}

        <div className="border-t border-gray-200" />

        {/* Input */}
        <div className="w-full">
          <p className="text-sm font-medium mb-3">Input for Processing</p>
          <textarea
            placeholder="Enter the input that will be processed by the selected agents..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="input w-full h-32"
            rows={4}
          />
        </div>

        {/* Execute Button */}
        <Button
          onClick={handleExecute}
          disabled={loading || !input.trim() || selectedAgents.length === 0}
          className={`w-full flex items-center justify-center gap-2 py-3 ${selectedBlockInfo?.color.split(' ')[0].replace('text-', 'bg-').replace('500', '600')} text-white hover:opacity-90`}
        >
          {loading ? (
            'Executing...'
          ) : (
            <>
              <FiPlay /> Execute {selectedBlockInfo?.name} Block
            </>
          )}
        </Button>

        {/* Execution Results */}
        {executionResult && (
          <div className="w-full">
            <div className="border-t border-gray-200 mb-4" />
            <h3 className="text-lg font-semibold mb-3">Execution Results</h3>

            <div className="flex flex-col gap-2">
              {/* Final Result Accordion */}
              <div className="border border-gray-200 rounded-md overflow-hidden">
                <button
                  onClick={() => toggleConfig('finalResult')}
                  className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FiZap className="text-green-500" />
                    <span className="font-medium">Final Result</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">
                      Success
                    </span>
                  </div>
                  {openConfig.finalResult ? <FiChevronDown /> : <FiChevronRight />}
                </button>
                {openConfig.finalResult && (
                  <div className="p-4 bg-white border-t border-gray-200">
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200 overflow-x-auto">
                      <pre className="text-sm whitespace-pre-wrap font-mono">
                        {typeof executionResult.result === 'string'
                          ? executionResult.result
                          : JSON.stringify(executionResult.result, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Reflection History */}
              {executionResult.reflectionHistory && (
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <button
                    onClick={() => toggleConfig('reflectionHistory')}
                    className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FiRefreshCw className="text-blue-500" />
                      <span className="font-medium">Reflection History</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                        {executionResult.reflectionHistory.length} rounds
                      </span>
                    </div>
                    {openConfig.reflectionHistory ? <FiChevronDown /> : <FiChevronRight />}
                  </button>
                  {openConfig.reflectionHistory && (
                    <div className="p-4 bg-white border-t border-gray-200 flex flex-col gap-3">
                      {executionResult.reflectionHistory.map((round: any, index: number) => (
                        <div
                          key={index}
                          className="p-3 bg-blue-50 rounded-md border border-blue-100"
                        >
                          <p className="text-sm font-medium mb-2">Round {index + 1}</p>
                          <pre className="text-sm whitespace-pre-wrap font-mono bg-white p-2 rounded border border-blue-100">
                            {JSON.stringify(round, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Debate History */}
              {executionResult.debateHistory && (
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <button
                    onClick={() => toggleConfig('debateHistory')}
                    className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FiMessageSquare className="text-purple-500" />
                      <span className="font-medium">Debate History</span>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded font-medium">
                        {executionResult.debateHistory.length} rounds
                      </span>
                    </div>
                    {openConfig.debateHistory ? <FiChevronDown /> : <FiChevronRight />}
                  </button>
                  {openConfig.debateHistory && (
                    <div className="p-4 bg-white border-t border-gray-200 flex flex-col gap-3">
                      {executionResult.debateHistory.map((round: any, index: number) => (
                        <div
                          key={index}
                          className="p-3 bg-purple-50 rounded-md border border-purple-100"
                        >
                          <p className="text-sm font-medium mb-2">Debate Round {index + 1}</p>
                          <pre className="text-sm whitespace-pre-wrap font-mono bg-white p-2 rounded border border-purple-100">
                            {JSON.stringify(round, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Execution Metrics */}
              <div className="border border-gray-200 rounded-md overflow-hidden">
                <button
                  onClick={() => toggleConfig('metrics')}
                  className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FiTool className="text-orange-500" />
                    <span className="font-medium">Execution Metrics</span>
                  </div>
                  {openConfig.metrics ? <FiChevronDown /> : <FiChevronRight />}
                </button>
                {openConfig.metrics && (
                  <div className="p-4 bg-white border-t border-gray-200">
                    <div className="p-3 bg-orange-50 rounded-md border border-orange-100 flex flex-col gap-2">
                      {executionResult.executionMetrics &&
                        Object.entries(executionResult.executionMetrics).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="font-medium text-gray-700">{key}:</span>
                            <span className="font-mono bg-white px-1 rounded border border-orange-100">
                              {String(value)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
