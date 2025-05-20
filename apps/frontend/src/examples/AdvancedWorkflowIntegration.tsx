import React, { useState, useCallback } from 'react';
import { useWorkflowIntegration } from '../hooks/useWorkflowIntegration.js';
import { AgentWorkflowManager } from '../components/AgentWorkflowManager.js';
import { StatusMonitor } from '../components/StatusMonitor.js';
import { DataAnalysisTool } from '@the-new-fuse/core/tools/data-analysis';
import { VisualizationTool } from '@the-new-fuse/core/tools/visualization';
import { StatisticalTool } from '@the-new-fuse/core/tools/statistical';

interface AnalysisConfig {
  dataset: string;
  metrics: string[];
  visualizations: string[];
  outputFormat: 'json' | 'csv' | 'markdown';
}

export function AdvancedWorkflowIntegration() {
  const [analysisConfig, setAnalysisConfig] = useState<AnalysisConfig>({
    dataset: '',
    metrics: [],
    visualizations: [],
    outputFormat: 'json'
  });

  const {
    isConnected,
    activeWorkflows,
    startWorkflow,
    stopWorkflow
  } = useWorkflowIntegration();

  const handleAnalysisStart = useCallback(async () => {
    const tools = [
      new DataAnalysisTool(),
      new VisualizationTool(),
      new StatisticalTool()
    ];

    try {
      const workflow = await startWorkflow({
        type: 'analysis',
        config: analysisConfig,
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description
        }))
      });

    } catch (error) {
      console.error('Failed to start analysis:', error);
    }
  }, [analysisConfig, startWorkflow]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Analysis Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Dataset
            </label>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={analysisConfig.dataset}
              onChange={(e) => setAnalysisConfig((prev: any) => ({
                ...prev,
                dataset: e.target.value
              }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Metrics
            </label>
            <select
              multiple
              className="w-full border rounded p-2"
              value={analysisConfig.metrics}
              onChange={(e) => setAnalysisConfig((prev: any) => ({
                ...prev,
                metrics: Array.from(e.target.selectedOptions, option => option.value)
              }))}
            >
              <option value="revenue">Revenue Analysis</option>
              <option value="trends">Trend Analysis</option>
              <option value="segments">Segment Analysis</option>
              <option value="forecasting">Forecasting</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Output Format
            </label>
            <select
              className="w-full border rounded p-2"
              value={analysisConfig.outputFormat}
              onChange={(e) => setAnalysisConfig((prev: any) => ({
                ...prev,
                outputFormat: e.target.value as 'json' | 'csv' | 'markdown'
              }))}
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="markdown">Markdown</option>
            </select>
          </div>

          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={handleAnalysisStart}
            disabled={!isConnected}
          >
            Start Analysis
          </button>
        </div>
      </div>

      <AgentWorkflowManager />
      <StatusMonitor />

      <div className="bg-gray-100 rounded-lg p-4">
        <h3 className="font-medium mb-2">Active Workflows: {activeWorkflows}</h3>
        <pre className="bg-white p-4 rounded">
          {JSON.stringify(analysisConfig, null, 2)}
        </pre>
      </div>
    </div>
  );
}