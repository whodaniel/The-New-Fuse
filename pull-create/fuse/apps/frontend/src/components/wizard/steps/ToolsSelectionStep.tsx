// @ts-nocheck
import {
  ChevronDown,
  Clipboard,
  Cloud,
  Code,
  Cpu,
  Database,
  File,
  Github,
  Globe,
  Terminal,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useWizard } from '../WizardProvider';

export const ToolsSelectionStep: React.FC = () => {
  const { state, updateSessionData } = useWizard();

  // Get existing data from session if available
  const existingData = state.session?.data || {};

  // Form state
  const [selectedTools, setSelectedTools] = useState<string[]>(existingData.selectedTools || []);

  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>(
    existingData.selectedIntegrations || []
  );

  // Update session data when selections change
  useEffect(() => {
    updateSessionData({
      selectedTools,
      selectedIntegrations,
    });
  }, [selectedTools, selectedIntegrations, updateSessionData]);

  const handleToolsChange = (values: string[]) => {
    setSelectedTools(values);
  };

  const handleIntegrationsChange = (values: string[]) => {
    setSelectedIntegrations(values);
  };

  const handleSelectAll = (category: 'tools' | 'integrations') => {
    if (category === 'tools') {
      setSelectedTools([
        'save-file',
        'edit-file',
        'remove-files',
        'open-browser',
        'web-search',
        'web-fetch',
        'launch-process',
        'kill-process',
        'read-process',
        'write-process',
        'list-processes',
        'diagnostics',
        'codebase-retrieval',
        'remember',
      ]);
    } else {
      setSelectedIntegrations(['github-api', 'linear', 'jira', 'confluence', 'notion', 'supabase']);
    }
  };

  const handleClearAll = (category: 'tools' | 'integrations') => {
    if (category === 'tools') {
      setSelectedTools([]);
    } else {
      setSelectedIntegrations([]);
    }
  };

  const toolCategories = [
    {
      name: 'File Management',
      icon: File,
      tools: [
        { id: 'save-file', label: 'Save File', description: 'Create new files with content' },
        { id: 'edit-file', label: 'Edit File', description: 'View, create, and edit files' },
        { id: 'remove-files', label: 'Remove Files', description: 'Safely delete files' },
      ],
    },
    {
      name: 'Web Interaction',
      icon: Globe,
      tools: [
        {
          id: 'open-browser',
          label: 'Open Browser',
          description: 'Open URLs in the default browser',
        },
        { id: 'web-search', label: 'Web Search', description: 'Search the web for information' },
        {
          id: 'web-fetch',
          label: 'Web Fetch',
          description: 'Fetch and convert webpage content to Markdown',
        },
      ],
    },
    {
      name: 'Process Management',
      icon: Terminal,
      tools: [
        { id: 'launch-process', label: 'Launch Process', description: 'Run shell commands' },
        { id: 'kill-process', label: 'Kill Process', description: 'Terminate processes' },
        { id: 'read-process', label: 'Read Process', description: 'Read output from a terminal' },
        { id: 'write-process', label: 'Write Process', description: 'Write input to a terminal' },
        {
          id: 'list-processes',
          label: 'List Processes',
          description: 'List all known terminals and their states',
        },
      ],
    },
    {
      name: 'Code Analysis',
      icon: Code,
      tools: [
        { id: 'diagnostics', label: 'Diagnostics', description: 'Get issues from the IDE' },
        {
          id: 'codebase-retrieval',
          label: 'Codebase Retrieval',
          description: 'Search the codebase for information',
        },
      ],
    },
    {
      name: 'Memory Tools',
      icon: Cpu,
      tools: [{ id: 'remember', label: 'Remember', description: 'Create long-term memories' }],
    },
  ];

  const integrationCategories = [
    {
      name: 'Development Tools',
      icon: Github,
      integrations: [
        {
          id: 'github-api',
          label: 'GitHub API',
          description: 'Interact with GitHub repositories, issues, and PRs',
        },
        { id: 'linear', label: 'Linear', description: 'Manage tasks and issues in Linear' },
      ],
    },
    {
      name: 'Project Management',
      icon: Clipboard,
      integrations: [
        { id: 'jira', label: 'Jira', description: 'Work with Jira issues and projects' },
        {
          id: 'confluence',
          label: 'Confluence',
          description: 'Access and update Confluence pages',
        },
      ],
    },
    {
      name: 'Knowledge Management',
      icon: Database,
      integrations: [
        { id: 'notion', label: 'Notion', description: 'Interact with Notion databases and pages' },
      ],
    },
    {
      name: 'Cloud Services',
      icon: Cloud,
      integrations: [
        {
          id: 'supabase',
          label: 'Supabase',
          description: 'Interact with Supabase databases and services',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Tools & Integrations</h2>

      <p className="text-gray-600 mb-6">
        Select the tools and integrations you want to enable for your AI assistants.
      </p>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Tools</h3>
            <div className="flex space-x-2">
              <button
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => handleSelectAll('tools')}
              >
                Select All
              </button>
              <button
                className="px-2 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                onClick={() => handleClearAll('tools')}
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {toolCategories.map((category, idx) => (
              <details key={idx} className="bg-gray-50 rounded-md" open={idx === 0}>
                <summary className="p-3 cursor-pointer flex items-center justify-between hover:bg-gray-100 rounded-md">
                  <div className="flex items-center space-x-2">
                    <category.icon className="w-4 h-4" />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </summary>
                <div className="pb-4 px-3">
                  <div className="space-y-3">
                    {category.tools.map((tool) => (
                      <label key={tool.id} className="flex items-start space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          value={tool.id}
                          checked={selectedTools.includes(tool.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTools([...selectedTools, tool.id]);
                            } else {
                              setSelectedTools(selectedTools.filter((t) => t !== tool.id));
                            }
                          }}
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{tool.label}</div>
                          <div className="text-sm text-gray-600">{tool.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>

        <hr className="border-gray-200" />

        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Integrations</h3>
            <div className="flex space-x-2">
              <button
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => handleSelectAll('integrations')}
              >
                Select All
              </button>
              <button
                className="px-2 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                onClick={() => handleClearAll('integrations')}
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {integrationCategories.map((category, idx) => (
              <details key={idx} className="bg-gray-50 rounded-md" open={idx === 0}>
                <summary className="p-3 cursor-pointer flex items-center justify-between hover:bg-gray-100 rounded-md">
                  <div className="flex items-center space-x-2">
                    <category.icon className="w-4 h-4" />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </summary>
                <div className="pb-4 px-3">
                  <div className="space-y-3">
                    {category.integrations.map((integration) => (
                      <label
                        key={integration.id}
                        className="flex items-start space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          value={integration.id}
                          checked={selectedIntegrations.includes(integration.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIntegrations([...selectedIntegrations, integration.id]);
                            } else {
                              setSelectedIntegrations(
                                selectedIntegrations.filter((i) => i !== integration.id)
                              );
                            }
                          }}
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{integration.label}</div>
                          <div className="text-sm text-gray-600">{integration.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> You can always change these settings later in your workspace
            settings.
          </p>
        </div>
      </div>
    </div>
  );
};
