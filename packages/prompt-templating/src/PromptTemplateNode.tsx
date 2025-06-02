import React, { useState, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  Settings, 
  Play, 
  FileText, 
  Variable, 
  Edit3,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PromptTemplate, PromptTemplateService } from '../types.js';

interface PromptTemplateNodeProps {
  id: string;
  data: {
    templateId?: string;
    versionId?: string;
    variables?: Record<string, any>;
    outputVariable?: string;
    templateService: PromptTemplateService;
    onTemplateSelect?: (templateId: string) => void;
    onVariableChange?: (variables: Record<string, any>) => void;
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
  const [template, setTemplate] = useState<PromptTemplate | null>(null);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [executionResult, setExecutionResult] = useState<any>(null);

  // Load templates on mount
  React.useEffect(() => {
    const loadTemplates = async () => {
      try {
        const allTemplates = await data.templateService.listTemplates();
        setTemplates(allTemplates);
        
        if (data.templateId) {
          const loadedTemplate = await data.templateService.getTemplate(data.templateId);
          setTemplate(loadedTemplate);
        }
      } catch (error) {
        console.error('Error loading templates:', error);
      }
    };
    
    loadTemplates();
  }, [data.templateService, data.templateId]);

  const handleTemplateSelect = useCallback(async (templateId: string) => {
    try {
      const selectedTemplate = await data.templateService.getTemplate(templateId);
      setTemplate(selectedTemplate);
      data.onTemplateSelect?.(templateId);
    } catch (error) {
      console.error('Error selecting template:', error);
    }
  }, [data]);

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
    try {
      const result = await data.templateService.executeTemplate(
        data.templateId,
        data.versionId,
        data.variables
      );
      setExecutionResult(result);
    } catch (error) {
      console.error('Error executing template:', error);
    } finally {
      setIsExecuting(false);
    }
  }, [data]);

  const getCurrentVersion = () => {
    if (!template) return null;
    return data.versionId 
      ? template.versions.find(v => v.id === data.versionId)
      : template.versions.find(v => v.id === template.currentVersion);
  };

  const currentVersion = getCurrentVersion();

  return (
    <div 
      className={`bg-white rounded-lg border-2 shadow-lg transition-all ${
        selected ? 'border-blue-500 shadow-blue-200' : 'border-gray-200'
      } ${isExpanded ? 'w-96' : 'w-64'}`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-purple-500"
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
                {template ? template.name : 'No template selected'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={handleExecute}
              disabled={!data.templateId || isExecuting}
              className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
              title="Execute template"
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
        {/* Template Selection */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Template
          </label>
          <select
            value={data.templateId || ''}
            onChange={(e) => handleTemplateSelect(e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select a template...</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Version Selection */}
        {template && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Version
            </label>
            <select
              value={data.versionId || template.currentVersion}
              onChange={(e) => data.onVariableChange?.({ ...data.variables, __versionId: e.target.value })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {template.versions.map(v => (
                <option key={v.id} value={v.id}>
                  Version {v.version} {v.name ? `- ${v.name}` : ''} ({v.label})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Variables */}
        {currentVersion && isExpanded && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Variable className="w-3 h-3" />
              Variables
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {Object.entries(currentVersion.variables).map(([key, defaultValue]) => (
                <div key={key}>
                  <label className="block text-xs text-gray-600 mb-1">
                    {key}
                  </label>
                  <input
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
        )}

        {/* Output Variable */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Output Variable
          </label>
          <input
            type="text"
            value={data.outputVariable || ''}
            onChange={(e) => data.onVariableChange?.({ ...data.variables, __outputVariable: e.target.value })}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Variable name for output..."
          />
        </div>

        {/* Execution Status */}
        {isExecuting && (
          <div className="flex items-center gap-2 text-xs text-blue-600 mb-2">
            <div className="animate-spin w-3 h-3 border border-blue-600 border-t-transparent rounded-full"></div>
            Executing template...
          </div>
        )}

        {/* Execution Result */}
        {executionResult && !isExecuting && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">Result:</span>
              <span className={`px-1 py-0.5 rounded text-xs ${
                executionResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {executionResult.success ? 'Success' : 'Failed'}
              </span>
            </div>
            {executionResult.success ? (
              <div className="text-gray-600">
                Response time: {executionResult.responseTime}ms
                {executionResult.tokenUsage && (
                  <div>Tokens: {executionResult.tokenUsage}</div>
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
      />
    </div>
  );
};

export default PromptTemplateNode;
