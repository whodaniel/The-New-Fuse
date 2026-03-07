// @ts-nocheck
import React, { useState } from 'react';
import { useModels } from '../../hooks/useModels';
import { usePromptTemplates } from '../../hooks/usePromptTemplates';
import { Button, Tabs } from '../ui/design-system';
import { PromptEditor } from './PromptEditor';
import { PromptSaveModal } from './PromptSaveModal';
import { ResultsViewer } from './ResultsViewer';
import { TestCaseManager } from './TestCaseManager';
import { VariableManager } from './VariableManager';
import { VersionHistory } from './VersionHistory';

export const PromptWorkbench: React.FC = () => {
  const { templates, saveTemplate } = usePromptTemplates();
  const { models, selectedModel, setSelectedModel, generateCompletion } = useModels();

  const [prompt, setPrompt] = useState<string>('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [testCases, setTestCases] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Removed unused loadTemplate destructuring if implied by handleTemplateSelect logic

  const handlePromptChange = (newPrompt: string) => {
    setPrompt(newPrompt);
  };

  const handleVariablesChange = (newVariables: Record<string, string>) => {
    setVariables(newVariables);
  };

  const handleTestCasesChange = (newTestCases: any[]) => {
    setTestCases(newTestCases);
  };

  const compilePrompt = (templateText: string, vars: Record<string, string>) => {
    let compiled = templateText;
    Object.entries(vars).forEach(([key, value]) => {
      compiled = compiled.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value);
    });
    return compiled;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt template');
      return;
    }

    setIsGenerating(true);
    setResults([]);

    try {
      if (testCases.length > 0) {
        // Run against all test cases
        const newResults = [];
        for (const testCase of testCases) {
          const testVars = { ...variables, ...testCase.variables };
          const compiledPrompt = compilePrompt(prompt, testVars);

          const result = await generateCompletion(compiledPrompt);
          newResults.push({
            testCase: testCase.name,
            prompt: compiledPrompt,
            result,
            timestamp: new Date().toISOString(),
          });
        }
        setResults(newResults);
      } else {
        // Run with current variables
        const compiledPrompt = compilePrompt(prompt, variables);
        const result = await generateCompletion(compiledPrompt);
        setResults([
          {
            prompt: compiledPrompt,
            result,
            timestamp: new Date().toISOString(),
          },
        ]);
      }

      // toast success replaced with console or custom notification if available
      console.log('Generation complete');
    } catch (error) {
      alert(`Generation failed: ${(error as Error).message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    setIsSaveModalOpen(true);
  };

  const handleTemplateSelect = (templateId: string) => {
    if (templateId) {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        setPrompt(template.content);
        setVariables(template.variables || {});
        setTestCases(template.testCases || []);
        setActiveTemplate(templateId);
        console.log(`Loaded "${template.name}"`);
      }
    } else {
      setActiveTemplate(null);
    }
  };

  const tabs = [
    {
      id: 'edit',
      title: 'Edit Prompt',
      content: <PromptEditor prompt={prompt} onChange={handlePromptChange} />,
    },
    {
      id: 'variables',
      title: 'Variables',
      content: <VariableManager variables={variables} onChange={handleVariablesChange} />,
    },
    {
      id: 'test-cases',
      title: 'Test Cases',
      content: <TestCaseManager testCases={testCases} onChange={handleTestCasesChange} />,
    },
    {
      id: 'results',
      title: 'Results',
      content: <ResultsViewer results={results} />,
    },
    {
      id: 'history',
      title: 'Version History',
      content: <VersionHistory templateId={activeTemplate} />,
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Prompt Engineering Workbench</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <select
            className="input w-full md:w-[200px]"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            <option value="" disabled>
              Select model
            </option>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>

          <select
            className="input w-full md:w-[250px]"
            value={activeTemplate || ''}
            onChange={(e) => handleTemplateSelect(e.target.value)}
          >
            <option value="">Load template...</option>
            {templates.map((template: any) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>

          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave}>
            Save Template
          </Button>

          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4">
          <Tabs tabs={tabs} />
        </div>
      </div>

      <PromptSaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={(name, description) => {
          saveTemplate({
            id: activeTemplate || undefined,
            name,
            description,
            content: prompt,
            variables,
            testCases,
          });
          console.log('Template saved');
        }}
        initialData={activeTemplate ? templates.find((t) => t.id === activeTemplate) : undefined}
      />
    </div>
  );
};
