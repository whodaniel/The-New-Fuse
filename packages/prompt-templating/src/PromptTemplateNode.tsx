import React, { useState, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  Play, 
  FileText, 
  Variable, 
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { PromptTemplate, PromptTemplateService, PromptVersion } from './types';

interface PromptTemplateNodeProps {
  id: string;
  data: {
    templateId?: string;
    versionId?: string;
    variables?: Record<string, any>;
    outputVariable?: string;
    templateService: PromptTemplateService;
    onTemplateSelect?: (templateId: string) => void;
    onVersionSelect?: (versionId: string) => void;
    onVariableChange?: (variables: Record<string, any>) => void;
    onOutputVariableChange?: (outputVariable: string) => void;
  };
  selected?: boolean;
}

export const PromptTemplateNode: React.FC<PromptTemplateNodeProps> = ({
  id,
  data,
  selected
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [template, setTemplate] = useState<PromptTemplate | null>(null);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load templates on mount
  React.useEffect(() => {
    const loadTemplates = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const allTemplates = await data.templateService.listTemplates();
        setTemplates(allTemplates);
        
        if (data.templateId) {
          const loadedTemplate = await data.templateService.getTemplate(data.templateId);
          setTemplate(loadedTemplate);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load templates';
        setError(errorMessage);
        console.error(`Error loading templates for node ${id}:`, err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTemplates();
  }, [data.templateService, data.templateId, id]);

  const handleTemplateSelect = useCallback(async (templateId: string) => {
    try {
      setError(null);
      const selectedTemplate = await data.templateService.getTemplate(templateId);
      setTemplate(selectedTemplate);
      data.onTemplateSelect?.(templateId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load template';
      setError(errorMessage);
      console.error(`Error selecting template for node ${id}:`, err);
    }
  }, [data, id]);

  const handleVariableChange = useCallback((key: string, value: string) => {
    const newVariables = {
      ...data.variables,
      [key]: value
    };
    data.onVariableChange?.(newVariables);
  }, [data]);

  const handleExecute = useCallback(async () => {
    if (!data.templateId) return;
    
    setIsExecuting(true);
    setError(null);
    try {
      console.log(`Executing template for node ${id}`);
      const result = await data.templateService.executeTemplate(
        data.templateId,
        data.versionId,
        data.variables
      );
      setExecutionResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Execution failed';
      setError(errorMessage);
      console.error(`Error executing template for node ${id}:`, err);
    } finally {
      setIsExecuting(false);
    }
  }, [data, id]);

  const getCurrentVersion = () => {
    if (!template) return null;
    return data.versionId 
      ? template.versions.find((v: PromptVersion) => v.id === data.versionId)
      : template.versions.find((v: PromptVersion) => v.id === template.currentVersion);
  };

  const currentVersion = getCurrentVersion();

  return (
    <div 
      id={`prompt-template-node-${id}`}
      className={`bg-white rounded-lg border-2 shadow-lg transition-all ${
        selected ? 'border-blue-500 shadow-blue-200' : 'border-gray-200'
      } ${isExpanded ? 'w-96' : 'w-64'}`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-purple-500"
        id={`${id}-input`}
      />

      {/* Node Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-md">
              <FileText className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Prompt Template</h3>
              <p className="text-xs text-gray-500">
                {template ? template.name : 'No template selected'} • Node: {id}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={handleExecute}
              disabled={!data.templateId || isExecuting}
              className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
              title={`Execute template (Node: ${id})`}
            >
              <Play className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Toggle expanded view"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Node Content */}
      <div className="p-4">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <div className="animate-spin w-3 h-3 border border-gray-500 border-t-transparent rounded-full"></div>
            Loading templates...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            Error: {error}
          </div>
        )}

        {/* Template Selection */}
        <div className="mb-4">
          <label htmlFor={`template-select-${id}`} className="block text-xs font-medium text-gray-700 mb-1">
            Template
          </label>
          <select
            id={`template-select-${id}`}
            value={data.templateId || ''}
            onChange={(e) => handleTemplateSelect(e.target.value)}
            disabled={isLoading}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">{isLoading ? 'Loading templates...' : 'Select a template...'}</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        {/* Version Selection */}
        {template && (
          <div className="mb-4">
            <label htmlFor={`version-select-${id}`} className="block text-xs font-medium text-gray-700 mb-1">
              Version
            </label>
            <select
              id={`version-select-${id}`}
              value={data.versionId || template.currentVersion}
              onChange={(e) => data.onVersionSelect?.(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {template.versions.map((v: PromptVersion) => (
                <option key={v.id} value={v.id}>
                  Version {v.version} {v.name ? `- ${v.name}` : ''} ({v.label})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Variables */}
        {/* Variables */}
        {currentVersion && isExpanded && (
          <>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Variable className="w-3 h-3" />
                Variables
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {Object.entries(currentVersion.variables).map(([key, defaultValue]) => (
                  <div key={key}>
                    <label htmlFor={`variable-input-${id}-${key}`} className="block text-xs text-gray-600 mb-1">
                      {key}
                    </label>
                    <input
                      id={`variable-input-${id}-${key}`}
                      type="text"
                      value={data.variables?.[key] || defaultValue}
                      onChange={(e) => handleVariableChange(key, e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder={`Enter ${key}...`}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor={`output-variable-input-${id}`} className="block text-xs font-medium text-gray-700 mb-1">
                Output Variable
              </label>
              <input
                id={`output-variable-input-${id}`}
                type="text"
                value={data.outputVariable || ''}
                onChange={(e) => data.onOutputVariableChange?.(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Variable name for output..."
              />
            </div>
          </>
        )}

        {/* Execution Status */}
        {isExecuting && (
          <div className="flex items-center gap-2 text-xs text-blue-600 mb-2">
            <div className="animate-spin w-3 h-3 border border-blue-600 border-t-transparent rounded-full"></div>
            Executing template on node {id}...
          </div>
        )}

        {/* Execution Result */}
        {executionResult && !isExecuting && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">Result (Node {id}):</span>
              <div className="flex items-center gap-1">
                <span className={`px-1 py-0.5 rounded text-xs ${
                  executionResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {executionResult.success ? 'Success' : 'Failed'}
                </span>
                <button
                  onClick={() => setExecutionResult(null)}
                  className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                  title="Clear result"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
            {executionResult.success ? (
              <div className="space-y-1">
                <div className="text-gray-600">
                  Response time: {executionResult.responseTime}ms
                  {executionResult.tokenUsage && (
                    <span className="ml-2">• Tokens: {executionResult.tokenUsage}</span>
                  )}
                </div>
                {executionResult.result && (
                  <div className="bg-white p-2 rounded border text-gray-800 max-h-20 overflow-y-auto">
                    <div className="font-medium text-xs text-gray-500 mb-1">Output:</div>
                    <div className="text-xs">
                      {typeof executionResult.result === 'string' 
                        ? executionResult.result.substring(0, 200) + (executionResult.result.length > 200 ? '...' : '')
                        : JSON.stringify(executionResult.result, null, 2).substring(0, 200) + '...'
                      }
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-600">
                Error: {executionResult.error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-purple-500"
        id={`${id}-output`}
      />
    </div>
  );
};

export default PromptTemplateNode;
