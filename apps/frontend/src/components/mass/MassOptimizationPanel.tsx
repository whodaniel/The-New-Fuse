// @ts-nocheck
import { MassOptimizationConfig, OptimizationJob } from '@the-new-fuse/types';
import React, { useEffect, useState } from 'react';
import { FiCheck, FiPlay, FiRefreshCw, FiSettings, FiTrendingUp, FiX, FiZap } from 'react-icons/fi';
import { useMassOptimization } from '../../hooks/useMassOptimization';
import { Button } from '../../ui/design-system';

interface MassOptimizationPanelProps {
  agentId?: string;
  agentIds?: string[];
  topologyId?: string;
  onOptimizationComplete?: (result: any) => void;
}

export const MassOptimizationPanel: React.FC<MassOptimizationPanelProps> = ({
  agentId,
  agentIds,
  topologyId,
  onOptimizationComplete,
}) => {
  const [optimizationStage, setOptimizationStage] = useState<
    'idle' | 'stage1' | 'stage2' | 'stage3' | 'complete'
  >('idle');
  const [currentJobs, setCurrentJobs] = useState<OptimizationJob[]>([]);
  const [config, setConfig] = useState<MassOptimizationConfig>({
    userId: '',
    validationDatasetId: '',
    maxCandidates: 10,
    optimizationRounds: 3,
    evaluationSampleSize: 20,
    llmConfig: {
      model: 'gpt-4',
      temperature: 0.7,
    },
  });

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const onConfigOpen = () => setIsConfigOpen(true);
  const onConfigClose = () => setIsConfigOpen(false);

  const {
    optimizeAgent,
    optimizeTopology,
    optimizeWorkflow,
    runFullOptimization,
    getOptimizationJob,
    getUserOptimizationJobs,
    loading,
    error,
  } = useMassOptimization();

  useEffect(() => {
    if (error) {
      alert(`Optimization Error: ${error}`); // Replacing toast with alert for now
    }
  }, [error]);

  const handleOptimizeAgent = async () => {
    if (!agentId) return;

    try {
      setOptimizationStage('stage1');
      const result = await optimizeAgent(agentId, config);
      setCurrentJobs([result.job]);

      // Poll for completion
      pollJobCompletion([result.job.id]);
    } catch (err) {
      setOptimizationStage('idle');
      alert('Failed to start optimization');
    }
  };

  const handleOptimizeTopology = async () => {
    if (!agentIds || agentIds.length === 0) return;

    try {
      setOptimizationStage('stage2');
      const result = await optimizeTopology(agentIds, config);
      setCurrentJobs([result.job]);

      pollJobCompletion([result.job.id]);
    } catch (err) {
      setOptimizationStage('idle');
    }
  };

  const handleOptimizeWorkflow = async () => {
    if (!topologyId) return;

    try {
      setOptimizationStage('stage3');
      const result = await optimizeWorkflow(topologyId, config);
      setCurrentJobs([result.job]);

      pollJobCompletion([result.job.id]);
    } catch (err) {
      setOptimizationStage('idle');
    }
  };

  const handleFullOptimization = async () => {
    if (!agentIds || agentIds.length === 0) return;

    try {
      setOptimizationStage('stage1');
      const result = await runFullOptimization(agentIds, config);

      // Get initial jobs
      const jobs = await Promise.all(result.jobIds.map((id) => getOptimizationJob(id)));
      setCurrentJobs(jobs);

      pollJobCompletion(result.jobIds);
    } catch (err) {
      setOptimizationStage('idle');
    }
  };

  const pollJobCompletion = async (jobIds: string[]) => {
    const pollInterval = setInterval(async () => {
      try {
        const jobs = await Promise.all(jobIds.map((id) => getOptimizationJob(id)));

        setCurrentJobs(jobs);

        const allCompleted = jobs.every(
          (job) => job.status === 'completed' || job.status === 'failed'
        );

        if (allCompleted) {
          clearInterval(pollInterval);
          setOptimizationStage('complete');

          const failedJobs = jobs.filter((job) => job.status === 'failed');

          if (failedJobs.length > 0) {
            alert(
              `Some optimizations failed: ${failedJobs.length} out of ${jobs.length} jobs failed`
            );
          } else {
            console.log('Optimization Complete!');
            onOptimizationComplete?.(jobs);
          }
        } else {
          // Update stage based on job types
          const runningJobs = jobs.filter((job) => job.status === 'running');
          if (runningJobs.length > 0) {
            const jobType = runningJobs[0].type;
            if (jobType === 'block_level') setOptimizationStage('stage1');
            else if (jobType === 'topology') setOptimizationStage('stage2');
            else if (jobType === 'workflow_level') setOptimizationStage('stage3');
          }
        }
      } catch (err) {
        clearInterval(pollInterval);
        setOptimizationStage('idle');
      }
    }, 2000);

    // Cleanup after 30 minutes
    setTimeout(() => clearInterval(pollInterval), 30 * 60 * 1000);
  };

  const getStageProgress = () => {
    switch (optimizationStage) {
      case 'stage1':
        return 33;
      case 'stage2':
        return 66;
      case 'stage3':
        return 90;
      case 'complete':
        return 100;
      default:
        return 0;
    }
  };

  const getStageDescription = () => {
    switch (optimizationStage) {
      case 'stage1':
        return 'Optimizing individual agent prompts...';
      case 'stage2':
        return 'Finding optimal workflow topology...';
      case 'stage3':
        return 'Fine-tuning workflow-level prompts...';
      case 'complete':
        return 'Optimization complete!';
      default:
        return 'Ready to optimize';
    }
  };

  const isOptimizing = optimizationStage !== 'idle' && optimizationStage !== 'complete';

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm bg-white">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FiZap className="text-orange-500" />
          <h2 className="text-lg font-semibold">MASS Optimization</h2>
          <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium border border-orange-200">
            AI-Powered
          </span>
        </div>
        <Button
          variant="ghost"
          onClick={onConfigOpen}
          disabled={isOptimizing}
          className="text-sm flex items-center gap-2"
        >
          <FiSettings /> Configure
        </Button>
      </div>

      <div className="p-6 flex flex-col gap-6">
        {/* Progress Section */}
        <div className="w-full">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600">{getStageDescription()}</span>
            <span className="text-sm font-medium">{getStageProgress()}%</span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${optimizationStage === 'complete' ? 'bg-green-500' : 'bg-orange-500'}`}
              style={{ width: `${getStageProgress()}%` }}
            />
          </div>
        </div>

        {/* Stage Indicators */}
        <div className="flex justify-center gap-4 w-full">
          {[
            { stage: 'stage1', label: 'Stage 1: Prompts', icon: FiRefreshCw },
            { stage: 'stage2', label: 'Stage 2: Topology', icon: FiTrendingUp },
            { stage: 'stage3', label: 'Stage 3: Workflow', icon: FiZap },
          ].map(({ stage, label, icon: IconComp }) => {
            const isActive = optimizationStage === stage;
            const stageIndex = ['stage1', 'stage2', 'stage3'].indexOf(stage);
            const isCompleted = getStageProgress() > (stageIndex + 1) * 33 - 33;

            return (
              <div key={stage} className="flex flex-col items-center gap-1 group relative">
                <div
                  className={`p-2 rounded-full transition-colors ${
                    isActive
                      ? 'bg-orange-500 text-white'
                      : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                  title={label}
                >
                  {isActive ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : isCompleted ? (
                    <FiCheck size={16} />
                  ) : (
                    <IconComp size={16} />
                  )}
                </div>
                <span className="text-xs text-center text-gray-600">{label.split(':')[0]}</span>

                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                  {label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full">
          {agentId && (
            <Button
              className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleOptimizeAgent}
              disabled={isOptimizing || !config.validationDatasetId}
            >
              {isOptimizing ? (
                'Optimizing...'
              ) : (
                <>
                  <FiPlay /> Optimize Agent Prompts (Stage 1)
                </>
              )}
            </Button>
          )}

          {agentIds && agentIds.length > 0 && (
            <Button
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleOptimizeTopology}
              disabled={isOptimizing || !config.validationDatasetId}
            >
              {isOptimizing ? (
                'Optimizing...'
              ) : (
                <>
                  <FiTrendingUp /> Optimize Topology (Stage 2)
                </>
              )}
            </Button>
          )}

          {topologyId && (
            <Button
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleOptimizeWorkflow}
              disabled={isOptimizing || !config.validationDatasetId}
            >
              {isOptimizing ? (
                'Optimizing...'
              ) : (
                <>
                  <FiZap /> Optimize Workflow (Stage 3)
                </>
              )}
            </Button>
          )}

          {agentIds && agentIds.length > 1 && (
            <Button
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleFullOptimization}
              disabled={isOptimizing || !config.validationDatasetId}
            >
              {isOptimizing ? (
                'Running Full Optimization...'
              ) : (
                <>
                  <FiZap /> Run Full MASS Pipeline
                </>
              )}
            </Button>
          )}
        </div>

        {/* Current Jobs Status */}
        {currentJobs.length > 0 && (
          <div className="w-full">
            <p className="text-sm font-medium mb-2">Current Jobs</p>
            <div className="flex flex-col gap-2">
              {currentJobs.map((job) => (
                <div
                  key={job.id}
                  className="w-full p-3 bg-gray-50 rounded-md border border-gray-100"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">
                        {job.type.replace('_', ' ').toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-600">ID: {job.id.slice(0, 8)}...</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium border ${
                        job.status === 'completed'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : job.status === 'failed'
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : job.status === 'running'
                              ? 'bg-orange-100 text-orange-700 border-orange-200'
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Validation Required Notice */}
        {!config.validationDatasetId && (
          <div className="w-full p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800 flex items-center gap-2">
              <span className="text-lg">⚠️</span> Please configure a validation dataset to enable
              MASS optimization
            </p>
          </div>
        )}
      </div>

      {/* Configuration Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">MASS Optimization Configuration</h3>
              <button onClick={onConfigClose} className="text-gray-500 hover:text-gray-700">
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="w-full">
                <label className="block mb-2 text-sm font-medium">Validation Dataset</label>
                <select
                  className="input w-full"
                  value={config.validationDatasetId}
                  onChange={(e) => setConfig({ ...config, validationDatasetId: e.target.value })}
                >
                  <option value="" disabled>
                    Select validation dataset...
                  </option>
                  <option value="dataset-1">Sample Math Problems</option>
                  <option value="dataset-2">Q&A Test Set</option>
                  <option value="dataset-3">Custom Dataset</option>
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block mb-2 text-sm font-medium">Max Candidates</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={config.maxCandidates}
                    onChange={(e) =>
                      setConfig({ ...config, maxCandidates: parseInt(e.target.value) || 10 })
                    }
                    min={5}
                    max={50}
                  />
                </div>

                <div className="flex-1">
                  <label className="block mb-2 text-sm font-medium">Optimization Rounds</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={config.optimizationRounds}
                    onChange={(e) =>
                      setConfig({ ...config, optimizationRounds: parseInt(e.target.value) || 3 })
                    }
                    min={1}
                    max={10}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block mb-2 text-sm font-medium">LLM Model</label>
                  <select
                    className="input w-full"
                    value={config.llmConfig?.model || 'gpt-4'}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        llmConfig: { ...config.llmConfig, model: e.target.value },
                      })
                    }
                  >
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="claude-3">Claude 3</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block mb-2 text-sm font-medium">Sample Size</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={config.evaluationSampleSize}
                    onChange={(e) =>
                      setConfig({ ...config, evaluationSampleSize: parseInt(e.target.value) || 20 })
                    }
                    min={5}
                    max={100}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={onConfigClose}>Save Configuration</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
