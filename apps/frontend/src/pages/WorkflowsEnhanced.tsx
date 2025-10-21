import React, { useState, useCallback } from 'react';
import { WorkflowCanvas } from '../components/WorkflowBuilder/WorkflowCanvas';
import { ModularPromptTemplatingSystem, PromptTemplateServiceImpl, PromptTemplate } from '@the-new-fuse/prompt-templating';
import { showNotification } from '../utils/notifications';

export const WorkflowsPage: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [promptTemplateService] = useState(() => new PromptTemplateServiceImpl());
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);

  // Handle exporting template to workflow
  const handleExportToWorkflow = useCallback((template: PromptTemplate) => {
    setSelectedTemplate(template);
    setActiveTab(0); // Switch to workflow tab
    setIsOpen(false);
    
    showNotification({
      title: 'Template ready for workflow',
      message: `"${template.name}" is ready to be added to your workflow`,
      type: 'success'
    });
  }, []);

  // Handle opening prompt template editor
  const handleOpenTemplateEditor = useCallback(() => {
    setIsOpen(true);
  }, []);

  return (
    <div className="p-6 h-screen">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Workflow Builder</h1>
          <p className="text-gray-600">
            Design and execute multi-step AI workflows with drag-and-drop components
          </p>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          <div className="w-full h-full">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 0
                    ? 'border-b-2 border-purple-500 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab(0)}
              >
                Workflow Canvas
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 1
                    ? 'border-b-2 border-purple-500 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab(1)}
              >
                Prompt Templates
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 2
                    ? 'border-b-2 border-purple-500 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab(2)}
              >
                Analytics
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 3
                    ? 'border-b-2 border-purple-500 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab(3)}
              >
                Settings
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 h-full">
              {/* Workflow Canvas Tab */}
              {activeTab === 0 && (
                <div className="flex flex-col h-full">
                  {/* Canvas Toolbar */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={handleOpenTemplateEditor}
                        className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
                      >
                        Create Prompt Template
                      </button>
                      {selectedTemplate && (
                        <div>
                          <span className="text-sm text-gray-600">
                            Selected template: <strong>{selectedTemplate.name}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Workflow Canvas */}
                  <div className="flex-1">
                    <WorkflowCanvas 
                      selectedTemplate={selectedTemplate}
                      promptTemplateService={promptTemplateService}
                    />
                  </div>
                </div>
              )}

              {/* Prompt Templates Tab */}
              {activeTab === 1 && (
                <div className="h-full">
                  <ModularPromptTemplatingSystem
                    templateService={promptTemplateService}
                    onExportToWorkflow={handleExportToWorkflow}
                  />
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 2 && (
                <div className="p-6">
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold">Workflow Analytics</h2>
                    
                    <div className="p-6 border border-gray-200 rounded-lg">
                      <h3 className="text-md font-medium mb-4">Execution Statistics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">127</div>
                          <div className="text-sm text-blue-600">Total Executions</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">94.2%</div>
                          <div className="text-sm text-green-600">Success Rate</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">1,250ms</div>
                          <div className="text-sm text-purple-600">Avg Response Time</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 border border-gray-200 rounded-lg">
                      <h3 className="text-md font-medium mb-4">Popular Node Types</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>Prompt Template</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                            </div>
                            <span className="text-sm text-gray-500">85%</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>LLM Completion</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '72%' }}></div>
                            </div>
                            <span className="text-sm text-gray-500">72%</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Data Transform</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '58%' }}></div>
                            </div>
                            <span className="text-sm text-gray-500">58%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 3 && (
                <div className="p-6">
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold">Workflow Settings</h2>
                    
                    <div className="p-6 border border-gray-200 rounded-lg">
                      <h3 className="text-md font-medium mb-4">Default Configuration</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Default LLM Model
                          </label>
                          <select 
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            title="Select default LLM model"
                            placeholder="Choose a model"
                          >
                            <option>GPT-4</option>
                            <option>GPT-3.5 Turbo</option>
                            <option>Claude-3 Sonnet</option>
                            <option>Claude-3 Haiku</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Execution Timeout (seconds)
                          </label>
                          <input 
                            type="number" 
                            defaultValue={300}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            title="Set execution timeout in seconds"
                            placeholder="300"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max Concurrent Executions
                          </label>
                          <input 
                            type="number" 
                            defaultValue={5}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            title="Set maximum concurrent executions"
                            placeholder="5"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-6 border border-gray-200 rounded-lg">
                      <h3 className="text-md font-medium mb-4">Prompt Template Settings</h3>
                      <div className="flex items-center justify-between">
                        <span>Enable version tracking</span>
                        <input 
                          type="checkbox" 
                          defaultChecked 
                          className="form-checkbox"
                          title="Enable or disable version tracking for templates"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Auto-save templates</span>
                        <input 
                          type="checkbox" 
                          defaultChecked 
                          className="form-checkbox"
                          title="Enable or disable auto-saving of templates"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Show usage analytics</span>
                        <input 
                          type="checkbox" 
                          defaultChecked 
                          className="form-checkbox"
                          title="Enable or disable usage analytics for templates"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Prompt Template Editor Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
          <div className="relative bg-white rounded-lg shadow-xl max-w-[90vw] max-h-[90vh] w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Prompt Template Editor</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Close modal"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-0 overflow-hidden">
              <div className="h-[70vh]">
                <ModularPromptTemplatingSystem
                  templateService={promptTemplateService}
                  onExportToWorkflow={handleExportToWorkflow}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowsPage;
